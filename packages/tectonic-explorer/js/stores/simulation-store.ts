import { observable, computed, action, runInAction, autorun, makeObservable } from "mobx";
import config, { Colormap } from "../config";
import * as THREE from "three";
import isEqual from "lodash/isEqual";
import { addInteractiveStateListener, getInteractiveState, IDataset, setInteractiveState, setNavigation } from "@concord-consortium/lara-interactive-api";
import { getCrossSectionRectangle, shouldSwapDirection } from "../plates-model/cross-section-utils";
import presets from "../presets";
import { getImageData } from "../utils";
import { initDatabase, loadModelFromCloud, saveModelToCloud } from "../storage";
import migrateState from "../state-migrations";
import workerController from "../worker-controller";
import ModelStore from "./model-store";
import { IWorkerProps } from "../plates-model/model-worker";
import { ICrossSectionOutput, IModelOutput } from "../plates-model/model-output";
import { IGlobeInteractionName } from "../plates-interactions/globe-interactions-manager";
import { ICrossSectionInteractionName } from "../plates-interactions/cross-section-interactions-manager";
import {
  BoundaryType, DEFAULT_CROSS_SECTION_CAMERA_ANGLE, DEFAULT_CROSS_SECTION_CAMERA_ZOOM,
  IBoundaryInfo, IVector2, IHotSpot, IDataSample, IVec3Array, RockKeyLabel, TabName, TempPressureValue, IInteractiveState, DATASET_PROPS, ICrossSectionWall
} from "../types";
import { ISerializedModel } from "../plates-model/model";
import getGrid from "../plates-model/grid";
import { firstNonSedimentaryRockLayer, rockProps } from "../plates-model/rock-properties";
import FieldStore from "./field-store";
import { convertBoundaryTypeToHotSpots, findBoundaryFieldAround, getBoundaryInfo, highlightBoundarySegment, unhighlightBoundary } from "./helpers/boundary-utils";
import { animateAngleAndZoomTransition, animateVectorTransition } from "./helpers/animation-utils";
import { log } from "../log";
import { takeCrossSectionSnapshot, takePlanetViewSnapshot } from "../shutterbug-support";

export interface ISerializedState {
  version: 4;
  appState: ISerializedAppState;
  modelState: ISerializedModel;
}

export interface ISerializedAppState {
  showCrossSectionView: boolean;
  mainCameraPos: IVec3Array;
  crossSectionCameraAngle: number;
  crossSectionCameraZoom: number;
  crossSectionPoint1?: IVec3Array;
  crossSectionPoint2?: IVec3Array;
  selectedTab: TabName;
}

export type ModelStateLabel = "notRequested" | "loading" | "loaded" | "incompatibleModel";

const DEFAULT_PLANET_CAMERA_POSITION = [4.5, 0, 0]; // (x, y, z)

const DEFAULT_TAB = "map-type";

export class SimulationStore {
  @observable planetWizard = config.planetWizard;
  @observable modelState: ModelStateLabel = "notRequested";
  @observable interaction: IGlobeInteractionName | ICrossSectionInteractionName | "none" = "none";
  @observable selectableInteractions = config.selectableInteractions;
  @observable isDrawingCrossSection = false;
  @observable showCrossSectionView = false;
  @observable crossSectionPoint1: THREE.Vector3 | null = null; // THREE.Vector3
  @observable crossSectionPoint2: THREE.Vector3 | null = null; // THREE.Vector3
  @observable playing = config.playing;
  @observable timestep = config.timestep;
  @observable colormap: Colormap = config.colormap;
  @observable wireframe = config.wireframe;
  @observable earthquakes = config.earthquakes;
  @observable volcanicEruptions = config.volcanicEruptions;
  @observable metamorphism = config.metamorphism;
  @observable sediments = config.sediments;
  @observable key = config.key;
  @observable selectedTab: TabName = DEFAULT_TAB;
  @observable renderVelocities = config.renderVelocities;
  @observable renderForces = config.renderForces;
  @observable renderEulerPoles = config.renderEulerPoles;
  @observable renderBoundaries = config.renderBoundaries;
  @observable renderLatLongLines = config.renderLatLongLines;
  @observable renderPlateLabels = config.renderPlateLabels;
  @observable targetModelStepsPerSecond = config.targetModelStepsPerSecond;
  @observable planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION;
  @observable planetCameraLocked = false;
  @observable planetCameraAnimating = false;
  @observable crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
  @observable crossSectionCameraZoom = DEFAULT_CROSS_SECTION_CAMERA_ZOOM;
  @observable crossSectionCameraAnimating = false;
  @observable rockLayers = !config.geode;
  @observable lastStoredModel: string | null = null;
  @observable savingModel = false;
  @observable relativeMotionStoppedDialogVisible = false;
  @observable dataSavingDialogVisible = false;
  // Note that this value should never be serialized and restored. It uses client time, which is not guaranteed to be
  // correct. It's only used to determine whether we should discard the current snapshot response within current session.
  @observable lastSnapshotRequestTimestamp: number | null = null;
  @observable debugMarker = new THREE.Vector3();
  @observable currentHotSpot: { position: THREE.Vector3; force: THREE.Vector3; } | null = null;
  @observable screenWidth = Infinity;
  @observable selectedBoundary: IBoundaryInfo | null = null;
  @observable currentDataSample: IDataSample | null = null;
  @observable dataSamples: IDataSample[] = [];
  @observable anyHotSpotDefinedByUser = false;
  @observable selectedRock: RockKeyLabel | null = null;
  @observable selectedRockFlash = false;
  @observable isCursorOverCrossSection = false;
  @observable measuredTemperature: TempPressureValue = null;
  @observable measuredPressure: TempPressureValue = null;
  // Why boundary is in fact a FieldStore? One field is enough to define a single boundary segment. No need to store more data.
  @observable highlightedBoundaries: FieldStore[] = [];
  // Greatly simplified plate tectonics model used by rendering and interaction code.
  // It's updated by messages coming from model worker where real calculations are happening.
  @observable model = new ModelStore();
  @observable.ref crossSectionOutput: ICrossSectionOutput = {
    dataFront: [],
    dataRight: [],
    dataBack: [],
    dataLeft: []
  };

  // interactiveState doesn't need to be observable. It's only used to store data that's not used by rendering code.
  interactiveState: IInteractiveState | null = null;

  constructor() {
    makeObservable(this);
    initDatabase();
    workerController.on("output", this.handleDataFromWorker);
    workerController.on("savedModel", this.saveStateToCloud);
    if (config.preset) {
      this.loadPresetModel(config.preset);
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId);
    }
    // Preload Grid helper class. It takes a few seconds to create, so it's better to do it right after requesting
    // the preset image data and use the time necessary to download the image. Note that it shouldn't be done too early
    // in the main thread, as then we'd block splash screen or progress bar rendering too.
    getGrid();

    autorun(() => {
      // postMessage is pretty expensive, so make sure it sends properties that are used by worker.
      workerController.postMessageToModel({ type: "props", props: this.workerProperties });
    });
    autorun(() => {
      if (this.model.relativeMotionStopped) {
        this.playing = false;
        this.relativeMotionStoppedDialogVisible = true;
      } else {
        this.relativeMotionStoppedDialogVisible = false;
      }
    });

    this.interactiveState = getInteractiveState<IInteractiveState>();
    // Setup client event listeners. They will ensure that another instance of this hook (or anything else
    // using client directly) makes changes to interactive state, this hook will receive these changes.
    const handleStateUpdate = (newState: IInteractiveState) => {
      this.interactiveState = newState;
    };
    addInteractiveStateListener<IInteractiveState>(handleStateUpdate);
  }

  // Computed (and cached!) properties.
  @computed get crossSectionSwapped() {
    return shouldSwapDirection(this.crossSectionPoint1, this.crossSectionPoint2);
  }

  @computed get crossSectionRectangle() {
    if (this.crossSectionPoint1 && this.crossSectionPoint2) {
      return getCrossSectionRectangle(this.crossSectionPoint1, this.crossSectionPoint2, this.crossSectionSwapped);
    }
    return null;
  }

  @computed get crossSectionPoint3() {
    return this.crossSectionRectangle?.p3 || null;
  }

  @computed get crossSectionPoint4() {
    return this.crossSectionRectangle?.p4 || null;
  }

  @computed get crossSectionVisible() {
    return !this.planetWizard && this.showCrossSectionView;
  }

  @computed get keyVisible() {
    return !this.planetWizard && this.key;
  }

  @computed get renderHotSpots() {
    return this.interaction === "force" || this.renderForces;
  }

  @computed get plateVelocityVisible() {
    // Don't show velocity arrows when the rock patterns are displayed, as they might be mixing up with the patterns.
    return this.colormap !== "rock" && this.renderVelocities;
  }

  @computed get simulationDisabled() {
    return this.model.relativeMotionStopped;
  }

  @computed get crossSectionDataSamples() {
    const result: Record<ICrossSectionWall, IDataSample[]> = {
      front: this.dataSamples.filter(s => s.crossSectionWall === "front"),
      back: this.dataSamples.filter(s => s.crossSectionWall === "back"),
      left: this.dataSamples.filter(s => s.crossSectionWall === "left"),
      right: this.dataSamples.filter(s => s.crossSectionWall === "right"),
      top: []
    };
    if (this.currentDataSample) {
      result[this.currentDataSample.crossSectionWall].push(this.currentDataSample);
    }
    return result;
  }

  @computed get workerProperties() {
    // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
    const props: IWorkerProps = {
      // The worker should start simulation after the main thread is fully ready. It lets us avoid a jump in the initial
      // simulation progress caused by the main thread loading slower than web worker.
      playing: this.modelState === "loaded" && this.playing,
      timestep: this.timestep,
      crossSectionPoint1: this.crossSectionPoint1,
      crossSectionPoint2: this.crossSectionPoint2,
      crossSectionPoint3: this.crossSectionPoint3,
      crossSectionPoint4: this.crossSectionPoint4,
      crossSectionSwapped: this.crossSectionSwapped,
      showCrossSectionView: this.showCrossSectionView,
      colormap: this.colormap,
      renderForces: this.renderForces,
      renderHotSpots: this.renderHotSpots,
      renderBoundaries: this.renderBoundaries,
      earthquakes: this.earthquakes,
      volcanicEruptions: this.volcanicEruptions,
      targetModelStepsPerSecond: this.targetModelStepsPerSecond,
      sediments: this.sediments
    };
    return props;
  }

  @computed get showCrossSectionCameraReset() {
    return this.crossSectionCameraAngle !== DEFAULT_CROSS_SECTION_CAMERA_ANGLE ||
            this.crossSectionCameraZoom !== DEFAULT_CROSS_SECTION_CAMERA_ZOOM;
  }

  @computed get showPlanetCameraReset() {
    // Slice is necessary to create regular Array from MobxObservableArray.
    return !isEqual(this.planetCameraPosition.slice(), DEFAULT_PLANET_CAMERA_POSITION);
  }

  @computed get snapshotAvailable() {
    return this.model.stepIdx > 0;
  }

  // Save part of the app / view state.
  @computed get serializableAppState(): ISerializedAppState {
    return {
      showCrossSectionView: this.showCrossSectionView,
      crossSectionCameraAngle: this.crossSectionCameraAngle,
      crossSectionCameraZoom: this.crossSectionCameraZoom,
      mainCameraPos: this.planetCameraPosition.slice(),
      crossSectionPoint1: this.crossSectionPoint1?.toArray(),
      crossSectionPoint2: this.crossSectionPoint2?.toArray(),
      selectedTab: this.selectedTab
    };
  }

  @computed get seismicDataVisible() {
    return this.earthquakes || this.volcanicEruptions;
  }

  @computed get dataSavingInProgress() {
    return this.lastSnapshotRequestTimestamp !== null;
  }

  // Actions.
  @action.bound setCrossSectionPoints(p1: THREE.Vector3 | null, p2: THREE.Vector3 | null) {
    this.crossSectionPoint1 = p1;
    this.crossSectionPoint2 = p2;
  }

  @action.bound setIsDrawingCrossSection(isDrawing: boolean) {
    this.isDrawingCrossSection = isDrawing;
  }

  @action.bound showCrossSection() {
    this.showCrossSectionView = true;
  }

  @action.bound setCurrentHotSpot(position: THREE.Vector3, force: THREE.Vector3) {
    // Make sure to create a new `currentHotSpot` object, so View3d can detect that this property has been changed.
    this.currentHotSpot = { position, force };
    this.anyHotSpotDefinedByUser = true;
  }

  @action.bound setHotSpot(data: IHotSpot) {
    this.currentHotSpot = null;
    workerController.postMessageToModel({ type: "setHotSpot", props: data });
  }

  @action.bound setPlateProps(props: { id: number, visible?: boolean }) {
    const plate = this.model.getPlate(props.id);
    if (plate) {
      // Set properties both in PlateStore and Plate model in the webworker.
      // Theoretically we could set it only in webworker, serialize the property and wait for the
      // update of store triggered by the post message. But this is easier and faster as long as the model
      // can't change this property.
      if (props.visible !== undefined) {
        plate.visible = props.visible;
      }
      workerController.postMessageToModel({ type: "setPlateProps", props });
    }
  }

  @action.bound setOption(option: string, value: unknown) {
    (this as any)[option] = value;

    // exit any interactions that require a stopped model if the user starts playing the model
    if ((option === "playing") && (value === true) &&
        ["crossSection", "measureTempPressure", "takeRockSample"].includes(this.interaction)) {
      this.interaction = "none";
    }
  }

  @action.bound setInteraction(interaction: IGlobeInteractionName | ICrossSectionInteractionName | "none") {
    if (interaction === "takeRockSample") {
      this.playing = false;
      // Open key automatically when user rock sample mode and show a tab with rock key.
      this.setKeyVisible(true);
      this.setSelectedTab("map-type");
    }
    if (interaction === "crossSection" || interaction === "measureTempPressure") {
      this.playing = false;
    }
    if (interaction === "collectData") {
      if (this.interactiveState) {
        if (!window.confirm("Entering data collection mode again will erase previously saved samples. Are you sure you want to do it?")) {
          return;
        }
      }
      this.playing = false;
      this.clearDataSamples();
    }
    if (this.interaction === "collectData" && interaction !== "collectData" && this.dataSamples.length > 0) {
      this.dataSavingDialogVisible = true;
    }
    this.interaction = interaction;
  }

  @action.bound closeCrossSection() {
    this.showCrossSectionView = false;
    this.crossSectionPoint1 = null;
    this.crossSectionPoint2 = null;
    // Disable cross-section-specific interactions (if active).
    if (this.interaction === "crossSection" || this.interaction === "measureTempPressure") {
      this.interaction = "none";
    }

    log({ action: "CrossSectionClosed" });
  }

  @action.bound setPlanetCameraLocked(value: boolean) {
    this.planetCameraLocked = value;
  }

  @action.bound setPlanetCameraPosition(posArray: IVec3Array) {
    this.planetCameraPosition = posArray;
  }

  @action.bound setCrossSectionCameraAngleAndZoom(angle: number, zoom: number) {
    this.crossSectionCameraAngle = angle;
    this.crossSectionCameraZoom = zoom;
  }

  @action.bound resetPlanetCamera() {
    if (this.planetCameraAnimating) {
      return;
    }
    this.planetCameraAnimating = true;

    animateVectorTransition({
      startPosition: this.planetCameraPosition,
      endPosition: DEFAULT_PLANET_CAMERA_POSITION,
      maxDuration: 2000,
      onAnimStep: (currentPos: IVec3Array) => runInAction(() => {
        this.planetCameraPosition = currentPos;
      }),
      onEnd: () => runInAction(() => {
        this.planetCameraAnimating = false;
      })
    });

    log({ action: "ResetPlanetOrientationClicked" });
  }

  @action.bound resetCrossSectionCamera() {
    if (this.crossSectionCameraAnimating) {
      return;
    }
    this.crossSectionCameraAnimating = true;

    animateAngleAndZoomTransition({
      startAngle: this.crossSectionCameraAngle,
      endAngle: DEFAULT_CROSS_SECTION_CAMERA_ANGLE,
      startZoom: this.crossSectionCameraZoom,
      endZoom: DEFAULT_CROSS_SECTION_CAMERA_ZOOM,
      maxDuration: 2000,
      onAnimStep: (currentAngle: number, currentZoom: number) => runInAction(() => {
        this.setCrossSectionCameraAngleAndZoom(currentAngle, currentZoom);
      }),
      onEnd: () => runInAction(() => {
        this.crossSectionCameraAnimating = false;
      })
    });

    log({ action: "ResetCrossSectionOrientationClicked" });
  }

  @action.bound loadPresetModel(presetName: string) {
    this.modelState = "loading";
    const preset = presets[presetName];
    getImageData(preset.img, (imgData: ImageData) => {
      workerController.postMessageToModel({
        type: "loadPreset",
        imgData,
        presetName,
        props: this.workerProperties
      });
    });
  }

  @action.bound loadCloudModel(modelId: string) {
    this.modelState = "loading";
    loadModelFromCloud(modelId, (serializedModel: ISerializedState) => {
      // Make sure that the models created by old versions can be still loaded.
      const state = migrateState(serializedModel);
      if (state !== "incompatibleModel") {
        const appState = state.appState;
        const modelState = state.modelState;
        this.deserializeAppState(appState);
        workerController.postMessageToModel({
          type: "loadModel",
          serializedModel: modelState,
          props: this.workerProperties
        });
      } else {
        this.modelState = "incompatibleModel";
      }
    });
  }

  // Restore the app / view state.
  @action.bound deserializeAppState(state: ISerializedAppState) {
    if (state.crossSectionPoint1) {
      this.crossSectionPoint1 = (new THREE.Vector3()).fromArray(state.crossSectionPoint1);
    } else {
      this.crossSectionPoint1 = null;
    }
    if (state.crossSectionPoint2) {
      this.crossSectionPoint2 = (new THREE.Vector3()).fromArray(state.crossSectionPoint2);
    } else {
      this.crossSectionPoint2 = null;
    }
    if (state.selectedTab) {
      this.selectedTab = state.selectedTab;
    }
    this.showCrossSectionView = state.showCrossSectionView;
    this.planetCameraPosition = state.mainCameraPos;
    this.crossSectionCameraAngle = state.crossSectionCameraAngle;
    this.crossSectionCameraZoom = state.crossSectionCameraZoom;
  }

  @action.bound handleDataFromWorker(data: IModelOutput) {
    if (this.modelState === "loading") {
      this.modelState = "loaded";
    }
    if (data.crossSection) {
      this.crossSectionOutput = data.crossSection;
    }
    if (data.debugMarker && !this.debugMarker.equals(data.debugMarker)) {
      this.debugMarker = (new THREE.Vector3()).copy(data.debugMarker);
    }
    this.model.handleDataFromWorker(data);
    if (this.model.stepIdx > 0 && this.model.stepIdx % config.stopAfter === 0) {
      this.setOption("playing", false);
    }
  }

  @action.bound setDensities(densities: Record<number, number>) {
    // Update model store directly too. It's NOT necessary, as worker controller would send back updated plate
    // properties. However, this ensures that UI response would much faster immediate. There's no need to wait for
    // a communication with service worker.
    this.model.plates.forEach(plate => {
      plate.density = densities[plate.id];
    });
    workerController.postMessageToModel({
      type: "setDensities",
      densities
    });
  }

  // Saves model and part of the app state to the cloud. This method is called when this component receives the current
  // model state from the web worker.
  @action.bound saveStateToCloud(modelState: ISerializedModel) {
    this.savingModel = true;
    const data: ISerializedState = {
      version: 4,
      appState: this.serializableAppState,
      modelState
    };
    saveModelToCloud(data, (modelId: string) => {
      runInAction(() => {
        this.lastStoredModel = modelId;
        this.savingModel = false;
      });
    });
  }

  @action.bound closeRelativeMotionDialog() {
    this.relativeMotionStoppedDialogVisible = false;
  }

  @action.bound closeDataSavingDialog() {
    this.dataSavingDialogVisible = false;
    this.clearDataSamples();
  }

  @action.bound unloadModel() {
    workerController.postMessageToModel({ type: "unload" });
  }

  @action.bound saveModel() {
    workerController.postMessageToModel({ type: "saveModel" });
  }

  @action.bound stepForward() {
    workerController.postMessageToModel({ type: "stepForward" });
    log({ action: "SimulationStepForward" });
  }

  @action.bound reload() {
    this.resetOptionsOnReload();

    if (config.preset) {
      this.loadPresetModel(config.preset);
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId);
    }
    if (config.planetWizard) {
      this.planetWizard = true;
    }

    log({ action: "SimulationReloaded" });
  }

  @action.bound resetOptionsOnReload() {
    this.interaction = "none";
    this.showCrossSectionView = false;
    this.crossSectionPoint1 = null;
    this.crossSectionPoint2 = null;
    this.playing = config.playing;
    this.timestep = config.timestep;
    this.colormap = config.colormap;
    this.wireframe = config.wireframe;
    this.earthquakes = config.earthquakes;
    this.volcanicEruptions = config.volcanicEruptions;
    this.metamorphism = config.metamorphism;
    this.sediments = config.sediments;
    this.key = config.key;
    this.selectedTab = DEFAULT_TAB;
    this.renderVelocities = config.renderVelocities;
    this.renderForces = config.renderForces;
    this.renderEulerPoles = config.renderEulerPoles;
    this.renderBoundaries = config.renderBoundaries;
    this.renderLatLongLines = config.renderLatLongLines;
    this.renderPlateLabels = config.renderPlateLabels;
    this.planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION;
    this.crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
    this.crossSectionCameraZoom = DEFAULT_CROSS_SECTION_CAMERA_ZOOM;
    this.rockLayers = !config.geode;
    this.selectedBoundary = null;
    this.anyHotSpotDefinedByUser = false;
    this.selectedRock = null;
    this.selectedRockFlash = false;
  }

  @action.bound takeLabeledSnapshot(label: string) {
    workerController.postMessageToModel({
      type: "takeLabeledSnapshot",
      label
    });
  }

  @action.bound restoreLabeledSnapshot(label: string) {
    workerController.postMessageToModel({
      type: "restoreLabeledSnapshot",
      label
    });
  }

  @action.bound restoreSnapshot() {
    this.playing = false;
    // Make sure that model is paused first. Then restore snapshot.
    workerController.postMessageToModel({ type: "restoreSnapshot" });
    log({ action: "SimulationStepBack" });
  }

  @action.bound restoreInitialSnapshot() {
    this.playing = false;
    // Make sure that model is paused first. Then restore snapshot.
    workerController.postMessageToModel({ type: "restoreInitialSnapshot" });
    log({ action: "SimulationReset" });
  }

  @action.bound setScreenWidth(val: number) {
    this.screenWidth = val;
  }

  @action.bound setAnyHotSpotDefinedByUser(val: boolean) {
    this.anyHotSpotDefinedByUser = val;
  }

  @action.bound setKeyVisible(val: boolean) {
    this.key = val;
  }

  @action.bound setEarthquakesVisible(val: boolean) {
    this.earthquakes = val;
    if (!this.seismicDataVisible && this.selectedTab === "seismic-data") {
      this.selectedTab = DEFAULT_TAB;
    }
  }

  @action.bound setVolcanicEruptionsVisible(val: boolean) {
    this.volcanicEruptions = val;
    if (!this.seismicDataVisible && this.selectedTab === "seismic-data") {
      this.selectedTab = DEFAULT_TAB;
    }
  }

  @action.bound setSelectedTab(val: TabName) {
    this.selectedTab = val;
  }

  @action.bound clearSelectedBoundary() {
    this.selectedBoundary = null;
    this.unhighlightBoundarySegment();
  }

  @action.bound setSelectedBoundary(canvasPosition: IVector2) {
    if (this.highlightedBoundaries.length < 2) {
      this.selectedBoundary = null;
      return;
    }
    const highlightedBoundaryField1 = this.highlightedBoundaries[0];
    const highlightedBoundaryField2 = this.highlightedBoundaries[1];
    const boundary = getBoundaryInfo(highlightedBoundaryField1, highlightedBoundaryField2, this.model) || null;
    boundary && (boundary.canvasClickPos = canvasPosition);
    this.selectedBoundary = boundary;
  }

  @action.bound setSelectedBoundaryType(type: BoundaryType) {
    if (this.selectedBoundary?.orientation) {
      this.selectedBoundary.type = type;
      this.setAnyHotSpotDefinedByUser(true);
      convertBoundaryTypeToHotSpots(this.selectedBoundary).forEach(hotSpot => this.setHotSpot(hotSpot));

      log({ action: "BoundaryTypeSelected", data: { value: type } });
    }
  }

  @action.bound setIsCursorOverCrossSection(isOver: boolean) {
    this.isCursorOverCrossSection = isOver;
  }

  @action.bound setTempAndPressure(temperature: TempPressureValue, pressure: TempPressureValue) {
    this.measuredPressure = pressure;
    this.measuredTemperature = temperature;
  }

  @action.bound setSelectedRock(rock: RockKeyLabel | null) {
    this.selectedRock = rock || null;
    if (!this.key) {
      // Open key automatically if it was closed by the user before.
      this.setKeyVisible(true);
    }
    this.setSelectedTab("map-type");
    if (rock) {
      log({ action: "RockKeyInfoDisplayed", data: { value: rock } });
    }
  }

  @action.bound setSelectedRockFlash(value: boolean) {
    this.selectedRockFlash = value;
  }

  @action.bound takeRockSampleFromSurface(position: THREE.Vector3) {
    // Note that in theory we could simply use: `this.model.topFieldAt(position).rockType`
    // FieldStore provides rockType property. However, this property is only valid and up to date when the rock
    // type rendering is enabled. Otherwise, it doesn't make sense to serialize it and pass through postMessage.
    workerController.getFieldInfo(position).then(serializedField => {
      // [0] is the top most rock.
      let topRock = serializedField.crust.rockLayers.rock[0];
      if (!this.sediments) {
        topRock = firstNonSedimentaryRockLayer(serializedField.crust.rockLayers.rock.map(rock => ({ rock }))).rock;
      }
      this.setSelectedRock(rockProps(topRock).label);
    });
  }

  @action.bound highlightBoundarySegment(position: THREE.Vector3) {
    this.unhighlightBoundarySegment();

    const targetField = this.model.topFieldAt(position);
    const boundaryField = findBoundaryFieldAround(targetField, this.model);
    if (boundaryField) {
      this.highlightedBoundaries = highlightBoundarySegment(boundaryField, this.model);
      this.highlightedBoundaries.forEach(f => f.plate.rerender());
    }
  }

  @action.bound unhighlightBoundarySegment() {
    if (this.highlightedBoundaries.length > 0) {
      this.highlightedBoundaries.forEach(f => {
        unhighlightBoundary(f);
        f.plate.rerender();
      });
      this.highlightedBoundaries = [];
    }
  }

  @action.bound setCurrentDataSample(data: IDataSample) {
    this.currentDataSample = data;
  }

  @action.bound setCurrentDataSampleNotes(notes: string) {
    if (this.currentDataSample) {
      this.currentDataSample.notes = notes;
    }
  }

  @action.bound clearCurrentDataSample() {
    if (this.currentDataSample) {
      this.currentDataSample = null;
    }
  }

  @action.bound submitCurrentDataSample() {
    if (this.currentDataSample) {
      const submittedDataSample = { ...this.currentDataSample };
      delete submittedDataSample.selected; // data sample is no longer selected after it's submitted
      this.dataSamples.push(submittedDataSample);
      this.saveInteractiveState();
      this.clearCurrentDataSample();
    }
  }

  @action.bound clearDataSamples() {
    this.dataSamples = [];
    this.clearCurrentDataSample();
  }

  // Helpers.
  getDataSamplesDataset(): IDataset {
    return {
      type: "dataset",
      version: 1,
      properties: DATASET_PROPS,
      rows: this.dataSamples.map(sample =>
        // Type casting is necessary, as some of the sample types are not basic. But they should not be added to
        // dataset props list anyway.
        DATASET_PROPS.map(propName => sample[propName]) as (string | number)[]
      )
    };
  }

  saveInteractiveState() {
    setNavigation({ enableForwardNav: false, message: "Please wait while Tectonic Explorer data is being saved." });

    const dataset = this.getDataSamplesDataset();
    const newState: IInteractiveState = {
      ...this.interactiveState,
      answerType: "interactive_state",
      dataset,
    };
    if (this.dataSamples.length === 0) {
      // Remove snapshots if there are no data samples.
      newState.crossSectionSnapshot = undefined;
      newState.planetViewSnapshot = undefined;
    }

    setInteractiveState<IInteractiveState>(newState);

    if (this.dataSamples.length === 0) {
      // No need to save snapshots if there are no data samples, so we can return early.
      return;
    }

    // Delay snapshot taking, so there's time for the view to re-render itself after state change.
    // Another approach could be to take snapshots directly in the components after they re-render themselves and pass
    // them to the simulation store. But it'll spread the logic across multiple components and might be more complex.
    setTimeout(action(() => {
      // This is client side timestamp and it's possible that the clock is set incorrectly. However, this is perfectly
      // fine here, as it's only used to compare the order of requests.
      const requestTimestamp = Date.now();
      const snapshotPromises = [takePlanetViewSnapshot()];
      if (this.crossSectionVisible) {
        snapshotPromises.push(takeCrossSectionSnapshot());
      }
      this.lastSnapshotRequestTimestamp = requestTimestamp;

      Promise.all(snapshotPromises)
        .then(([planetViewSnapshot, crossSectionSnapshot]: string[]) => {
          // Discard snapshots when responses don't follow order of the requests. It's possible, as snapshots usually
          // take a few seconds and their processing time is very variable.
          if (requestTimestamp === this.lastSnapshotRequestTimestamp) {
            setInteractiveState<IInteractiveState>({
              ...newState,
              planetViewSnapshot,
              crossSectionSnapshot
            });
          }
        })
        .catch((error: Error) => {
          // This will ignore errors from the previous requests. But that's fine, as we only care about the latest.
          if (requestTimestamp === this.lastSnapshotRequestTimestamp) {
            window.alert("Error while taking snapshot. Please try to submit you last pin again");
            console.error(error);
          }
        })
        .finally(action(() => {
          // Mark the request as processed.
          if (requestTimestamp === this.lastSnapshotRequestTimestamp) {
            this.lastSnapshotRequestTimestamp = null;
            // Slightly delay enabling forward navigation, as Activity Player also takes some time to save the updated
            // interactive state in Firestore. This possibly should be managed better by AP itself in the future.
            setTimeout(() => setNavigation({ enableForwardNav: true, message: "" }), 500);
          }
        }));
    }), 100);
  }

  markField = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "markField", props: { position } });
  };

  unmarkAllFields = () => {
    workerController.postMessageToModel({ type: "unmarkAllFields" });
  };

  getFieldInfo = (position: THREE.Vector3) => {
    workerController.getFieldInfo(position, true);
  };

  drawContinent = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "continentDrawing", props: { position } });
    log({ action: "ContinentAdded" });
  };

  eraseContinent = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "continentErasing", props: { position } });
    log({ action: "ContinentRemoved" });
  };

  markIslands = () => {
    workerController.postMessageToModel({ type: "markIslands" });
  };
}

const store = new SimulationStore();
(window as any).store = store;

export default store;
