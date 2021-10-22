import { observable, computed, action, runInAction, autorun, makeObservable } from "mobx";
import config, { Colormap } from "../config";
import * as THREE from "three";
import isEqual from "lodash/isEqual";
import { getCrossSectionRectangle, shouldSwapDirection } from "../plates-model/cross-section-utils";
import presets from "../presets";
import { getImageData } from "../utils";
import { initDatabase, loadModelFromCloud, saveModelToCloud } from "../storage";
import migrateState from "../state-migrations";
import workerController from "../worker-controller";
import ModelStore from "./model-store";
import { IWorkerProps } from "../plates-model/model-worker";
import { ICrossSectionOutput, IModelOutput } from "../plates-model/model-output";
import { IInteractionName } from "../plates-interactions/interactions-manager";
import { IVec3Array, RockKeyLabel } from "../types";
import { ISerializedModel } from "../plates-model/model";
import getGrid from "../plates-model/grid";
import { rockProps } from "../plates-model/rock-properties";

export interface ISerializedState {
  version: 4;
  appState: ISerializedAppState;
  modelState: ISerializedModel;
}

export interface ISerializedAppState {
  showCrossSectionView: boolean;
  mainCameraPos: IVec3Array;
  crossSectionCameraAngle: number;
  crossSectionPoint1?: IVec3Array;
  crossSectionPoint2?: IVec3Array;
}

export type ModelStateLabel = "notRequested" | "loading" | "loaded" | "incompatibleModel";

const DEFAULT_CROSS_SECTION_CAMERA_ANGLE = 3;

const DEFAULT_PLANET_CAMERA_POSITION = [4.5, 0, 0]; // (x, y, z)

export class SimulationStore {
  @observable planetWizard = config.planetWizard;
  @observable modelState: ModelStateLabel = "notRequested";
  @observable interaction: IInteractionName = "none";
  @observable selectableInteractions = config.selectableInteractions;
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
  @observable key = config.key;
  @observable renderVelocities = config.renderVelocities;
  @observable renderForces = config.renderForces;
  @observable renderEulerPoles = config.renderEulerPoles;
  @observable renderBoundaries = config.renderBoundaries;
  @observable renderLatLongLines = config.renderLatLongLines;
  @observable renderPlateLabels = config.renderPlateLabels;
  @observable planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION;
  @observable crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
  @observable rockLayers = config.rockLayers;
  @observable lastStoredModel: string | null = null;
  @observable savingModel = false;
  @observable debugMarker = new THREE.Vector3();
  @observable currentHotSpot: { position: THREE.Vector3; force: THREE.Vector3; } | null = null;
  @observable screenWidth = Infinity;
  @observable selectedRock: RockKeyLabel | null = null;
  // Greatly simplified plate tectonics model used by rendering and interaction code.
  // It's updated by messages coming from model worker where real calculations are happening.
  @observable model = new ModelStore();
  @observable.ref crossSectionOutput: ICrossSectionOutput = {
    dataFront: [],
    dataRight: [],
    dataBack: [],
    dataLeft: []
  };

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

    // For debugging purposes
    (window as any).s = this;
  }

  // Computed (and cached!) properties.
  @computed get crossSectionSwapped() {
    return shouldSwapDirection(this.crossSectionPoint1, this.crossSectionPoint2);
  }

  @computed get crossSectionRectangle() {
    if (config.crossSection3d && this.crossSectionPoint1 && this.crossSectionPoint2) {
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

  @computed get renderHotSpots() {
    return this.interaction === "force" || this.renderForces;
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
      volcanicEruptions: this.volcanicEruptions
    };
    return props;
  }

  @computed get showCrossSectionCameraReset() {
    return this.crossSectionCameraAngle !== DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
  }

  @computed get showPlanetCameraReset() {
    // Slice is necessary to create regular Array from MobxObservableArray.
    return !isEqual(this.planetCameraPosition.slice(), DEFAULT_PLANET_CAMERA_POSITION);
  }

  @computed get snapshotAvailable() {
    return this.model.stepIdx > 0;
  }

  // Save part of the app / view state.
  @computed get serializableAppState() {
    return {
      showCrossSectionView: this.showCrossSectionView,
      crossSectionCameraAngle: this.crossSectionCameraAngle,
      mainCameraPos: this.planetCameraPosition.slice(),
      crossSectionPoint1: this.crossSectionPoint1?.toArray(),
      crossSectionPoint2: this.crossSectionPoint2?.toArray()
    } as ISerializedAppState;
  }

  // Actions.
  @action.bound setCrossSectionPoints(p1: THREE.Vector3 | null, p2: THREE.Vector3 | null) {
    this.crossSectionPoint1 = p1;
    this.crossSectionPoint2 = p2;
  }

  @action.bound showCrossSection() {
    this.showCrossSectionView = true;
  }

  @action.bound setCurrentHotSpot(position: THREE.Vector3, force: THREE.Vector3) {
    // Make sure to create a new `currentHotSpot` object, so View3d can detect that this property has been changed.
    this.currentHotSpot = { position, force };
  }

  @action.bound setHotSpot(data: { position: THREE.Vector3; force: THREE.Vector3 }) {
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
  }

  @action.bound setInteraction(interaction: IInteractionName) {
    this.interaction = interaction;
    if (interaction === "crossSection" || interaction === "takeRockSample") {
      this.playing = false;
    }
  }

  @action.bound closeCrossSection() {
    this.showCrossSectionView = false;
    this.crossSectionPoint1 = null;
    this.crossSectionPoint2 = null;
    // Disable cross-section drawing too (if active).
    if (this.interaction === "crossSection") {
      this.interaction = "none";
    }
  }

  @action.bound setPlanetCameraPosition(posArray: IVec3Array) {
    this.planetCameraPosition = posArray;
  }

  @action.bound setCrossSectionCameraAngle(angle: number) {
    this.crossSectionCameraAngle = angle;
  }

  @action.bound resetPlanetCamera() {
    this.planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION;
  }

  @action.bound resetCrossSectionCamera() {
    this.crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
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
    this.showCrossSectionView = state.showCrossSectionView;
    this.planetCameraPosition = state.mainCameraPos;
    this.crossSectionCameraAngle = state.crossSectionCameraAngle;
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

  @action.bound unloadModel() {
    workerController.postMessageToModel({ type: "unload" });
  }

  @action.bound saveModel() {
    workerController.postMessageToModel({ type: "saveModel" });
  }

  @action.bound stepForward() {
    workerController.postMessageToModel({ type: "stepForward" });
  }

  @action.bound reload() {
    if (config.preset) {
      this.loadPresetModel(config.preset);
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId);
    }
    if (config.planetWizard) {
      this.planetWizard = true;
    }
    this.closeCrossSection();
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
  }

  @action.bound restoreInitialSnapshot() {
    this.playing = false;
    // Make sure that model is paused first. Then restore snapshot.
    workerController.postMessageToModel({ type: "restoreInitialSnapshot" });
  }

  @action.bound setScreenWidth(val: number) {
    this.screenWidth = val;
  }

  @action.bound setSelectedRock(rock: RockKeyLabel) {
    if (this.selectedRock === rock) {
      // Unselect action.
      this.selectedRock = null;
    } else {
      this.selectedRock = rock;
    }
  }

  @action.bound takeRockSampleFromSurface(position: THREE.Vector3) {
    // Note that in theory we could simply use: `this.model.topFieldAt(position).rockType`
    // FieldStore provides rockType property. However, this property is only valid and up to date when the rock
    // type rendering is enabled. Otherwise, it doesn't make sense to serialize it and pass through postMessage.
    workerController.getFieldInfo(position).then(serializedField => {
      // [0] is the top most rock.
      this.setSelectedRock(rockProps(serializedField.crust.rockLayers.rock[0]).label);
    });
  }

  // Helpers.
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
  };

  eraseContinent = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "continentErasing", props: { position } });
  };

  markIslands = () => {
    workerController.postMessageToModel({ type: "markIslands" });
  };
}

const store = new SimulationStore();
(window as any).store = store;

autorun(() => {
  // postMessage is pretty expensive, so make sure it sends properties that are used by worker.
  workerController.postMessageToModel({ type: "props", props: store.workerProperties });
});

export default store;
