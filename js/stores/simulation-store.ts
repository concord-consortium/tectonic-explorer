import { observable, computed, action, runInAction, autorun, makeObservable } from "mobx";
import config from "../config";
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
import { IVec3Array } from "../types";
import { ISerializedModel } from "../plates-model/model";


export interface ISerializedState {
  version: 3;
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

export type ModelStateLabel = "notRequested" | "loading" | "loaded";

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
  @observable colormap = config.colormap;
  @observable wireframe = config.wireframe;
  @observable earthquakes = config.earthquakes;
  @observable volcanicEruptions = config.volcanicEruptions;
  @observable key = config.key;
  @observable renderVelocities = config.renderVelocities;
  @observable renderForces = config.renderForces;
  @observable renderEulerPoles = config.renderEulerPoles;
  @observable renderBoundaries = config.renderBoundaries;
  @observable renderLatLongLines = config.renderLatLongLines;
  @observable renderPlateLabels = config.renderPlateLabels;
  @observable planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION;
  @observable crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE;
  @observable lastStoredModel: string | null = null;
  @observable savingModel = false;
  @observable debugMarker = new THREE.Vector3();
  @observable currentHotSpot: { position: THREE.Vector3; force: THREE.Vector3; } | null = null;
  @observable screenWidth = Infinity;
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
      playing: this.playing,
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

  @action.bound setOption(option: string, value: unknown) {
    (this as any)[option] = value;
  }

  @action.bound setInteraction(interaction: IInteractionName) {
    this.interaction = interaction;
    if (interaction === "crossSection") {
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
      const appState = state.appState;
      const modelState = state.modelState;
      this.deserializeAppState(appState);
      workerController.postMessageToModel({
        type: "loadModel",
        serializedModel: modelState,
        props: this.workerProperties
      });
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
    this.model.plates.forEach(plate => {
      plate.density = densities[plate.id];
    });
    // Recreate platesMap to update all its observers (e.g. SortableDensities component).
    this.model.platesMap = new Map(this.model.platesMap);
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
      version: 3,
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

  // Helpers.
  markField = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "markField", props: { position } });
  };

  unmarkAllFields = () => {
    workerController.postMessageToModel({ type: "unmarkAllFields" });
  };

  getFieldInfo = (position: THREE.Vector3) => {
    workerController.postMessageToModel({ type: "fieldInfo", props: { position } });
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

autorun(() => {
  // postMessage is pretty expensive, so make sure it sends properties that are used by worker.
  workerController.postMessageToModel({ type: "props", props: store.workerProperties });
});

export default store;
