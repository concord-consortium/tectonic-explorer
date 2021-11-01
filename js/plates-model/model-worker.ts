import * as THREE from "three";
import presets from "../presets";
import modelOutput, { IFieldsOutput, IModelOutput, IPlateOutput } from "./model-output";
import plateDrawTool from "./plate-draw-tool";
import markIslands from "./mark-islands";
import Model, { ISerializedModel } from "./model";
import config, { Colormap } from "../config";
import Field, { ISerializedField } from "./field";
import { IVector3 } from "../types";
import getGrid from "./grid";

// We're in web worker environment. Also, assume that Model can be exported for global scope for easier debugging.
declare const self: Worker & { m?: Model | null };

// Incoming messages:
export type IncomingModelWorkerMsg = ILoadPresetMsg | ILoadModelMsg | IUnloadMsg | IPropsMsg | IStepForwardMsg | ISetHotSpotMsg | ISetDensitiesMsg |
  IFieldInfoMsg | IContinentDrawingMsg | IContinentErasingMsg | IMarkIslandsMsg | IRestoreSnapshotMsg | IRestoreInitialSnapshotMsg |
  ITakeLabeledSnapshotMsg | IRestoreLabeledSnapshotMsg | ISaveModelMsg | IMarkFieldMsg | IUnmarkAllFieldsMsg | ISetPlateProps;

interface ILoadPresetMsg { type: "loadPreset"; imgData: ImageData; presetName: string; props: IWorkerProps; }
interface ILoadModelMsg { type: "loadModel"; serializedModel: string; props: IWorkerProps; }
interface IUnloadMsg { type: "unload"; }
interface IPropsMsg { type: "props"; props: IWorkerProps; }
interface IStepForwardMsg { type: "stepForward"; }
interface ISetHotSpotMsg { type: "setHotSpot"; props: { position: IVector3; force: IVector3 }; }
interface ISetDensitiesMsg { type: "setDensities"; densities: Record<string, number>; }
interface IFieldInfoMsg { type: "fieldInfo"; props: { position: IVector3, logOnly: boolean }; requestId: number }
interface IContinentDrawingMsg { type: "continentDrawing"; props: { position: IVector3 }; }
interface IContinentErasingMsg { type: "continentErasing"; props: { position: IVector3 }; }
interface IMarkIslandsMsg { type: "markIslands"; }
interface IRestoreSnapshotMsg { type: "restoreSnapshot"; }
interface IRestoreInitialSnapshotMsg { type: "restoreInitialSnapshot"; }
interface ITakeLabeledSnapshotMsg { type: "takeLabeledSnapshot"; label: string; }
interface IRestoreLabeledSnapshotMsg { type: "restoreLabeledSnapshot"; label: string; }
interface ISaveModelMsg { type: "saveModel"; }
interface IMarkFieldMsg { type: "markField"; props: { position: IVector3 }; }
interface IUnmarkAllFieldsMsg { type: "unmarkAllFields"; }
interface ISetPlateProps { type: "setPlateProps"; props: { id: number, visible?: boolean } }

// Messages sent by worker:
export type ModelWorkerMsg = IOutputMsg | ISavedModelMsg | IFieldInfoResponseMsg;

interface ISavedModelMsg { type: "savedModel"; data: { savedModel: string; } }
interface IOutputMsg { type: "output"; data: IModelOutput }
interface IFieldInfoResponseMsg { type: "fieldInfo"; requestId: number; response: ISerializedField; }

export function isResponseMsg(msg: ModelWorkerMsg): msg is IFieldInfoResponseMsg {
  return msg.type === "fieldInfo";
}

// postMessage serialization is expensive. Pass only selected properties. Note that only these properties
// will be available in the worker.
export interface IWorkerProps {
  playing: boolean;
  timestep: number;
  crossSectionPoint1: THREE.Vector3 | null;
  crossSectionPoint2: THREE.Vector3 | null;
  crossSectionPoint3: THREE.Vector3 | null;
  crossSectionPoint4: THREE.Vector3 | null;
  crossSectionSwapped: boolean;
  showCrossSectionView: boolean;
  colormap: Colormap;
  renderForces: boolean;
  renderHotSpots: boolean;
  renderBoundaries: boolean;
  earthquakes: boolean;
  volcanicEruptions: boolean;
}

const MAX_SNAPSHOTS_COUNT = 30;
let model: Model | null = null;
let props: IWorkerProps | null = null;
let forceRecalcOutput = false;
let initialSnapshot: ISerializedModel | null = null;
const snapshots: ISerializedModel[] = [];
const labeledSnapshots: Record<string, ISerializedModel> = {};

function step(forcedStep = false) {
  if (!model) {
    return;
  }
  let recalcOutput = false;
  // stopAfter is mostly used for automated tests.
  const stoppedByUrlParam = model.stepIdx > 0 && model.stepIdx % config.stopAfter === 0;
  if (props && ((props.playing && !stoppedByUrlParam) || forcedStep)) {
    if (config.snapshotInterval && model.stepIdx % config.snapshotInterval === 0) {
      if (model.stepIdx === 0) {
        initialSnapshot = model.serialize();
      } else {
        snapshots.push(model.serialize());
        while (snapshots.length > MAX_SNAPSHOTS_COUNT) {
          snapshots.shift();
        }
      }
    }
    model.step(props.timestep);
    recalcOutput = true;
  }
  if (recalcOutput || forceRecalcOutput) {
    const data = modelOutput(model, props, forceRecalcOutput);
    // postMessage let you specify "transferable objects". Those objects won't be serialized, but passed by reference
    // instead. It's possible to do it only for a few object types (e.g. ArrayBuffer).
    const transferableObjects: ArrayBufferLike[] = [];
    data.plates.forEach((plate: IPlateOutput) => {
      const fields = plate.fields;
      if (fields) {
        for (const key in fields) {
          const propertyArray = fields[key as keyof IFieldsOutput];
          if (propertyArray) {
            transferableObjects.push(propertyArray.buffer);
          }
        }
      }
    });
    self.postMessage({ type: "output", data }, transferableObjects);
    forceRecalcOutput = false;
  }
}

function workerFunction() {
  // Make sure that model doesn't calculate more than 30 steps per second (it can happen on fast machines).
  setTimeout(workerFunction, config.benchmark ? 0 : 33);
  step();
}

self.onmessage = function modelWorkerMsgHandler(event: { data: IncomingModelWorkerMsg }) {
  const data = event.data;
  if (data.type === "loadPreset") {
    // Export model to global m variable for convenience.
    self.m = model = new Model(data.imgData, presets[data.presetName].init || null);
    props = data.props;
  } else if (data.type === "loadModel") {
    const deserializedModel = Model.deserialize(JSON.parse(data.serializedModel) as ISerializedModel);
    // The model may have been stored mid-run, so reset it to ensure it is properly initialized
    deserializedModel.time = 0;
    deserializedModel.stepIdx = 0;
    self.m = model = deserializedModel;
    props = data.props;
  } else if (data.type === "unload") {
    self.m = model = null;
    initialSnapshot = null;
    snapshots.length = 0;
    self.postMessage({ type: "output", data: modelOutput(null) });
  } else if (data.type === "props") {
    props = data.props;
  } else if (data.type === "stepForward") {
    step(true);
  } else if (data.type === "setHotSpot") {
    const pos = (new THREE.Vector3()).copy(data.props.position as THREE.Vector3);
    const force = (new THREE.Vector3()).copy(data.props.force as THREE.Vector3);
    model?.setHotSpot(pos, force);
  } else if (data.type === "setDensities") {
    model?.setDensities(data.densities);
  } else if (data.type === "fieldInfo") {
    const pos = (new THREE.Vector3()).copy(data.props.position as THREE.Vector3);
    const field = model?.topFieldAt(pos, { visibleOnly: true });
    if (field) {
      if (data.props.logOnly) {
        // Useful for debugging and test.
        console.log(field);
      } else {
        self.postMessage({ type: "fieldInfo", requestId: data.requestId, response: field.serialize() });
      }
    }
  } else if (data.type === "continentDrawing" || data.type === "continentErasing") {
    const pos = (new THREE.Vector3()).copy(data.props.position as THREE.Vector3);
    const clickedField = model?.topFieldAt(pos);
    if (clickedField) {
      if (!clickedField.plate.isSubplate) {
        plateDrawTool(clickedField.plate, clickedField.id, data.type === "continentDrawing" ? "continent" : "ocean");
      } else {
        console.warn("Unexpected continent drawing on subplate");
      }
    }
  } else if (data.type === "markIslands") {
    // This should be called each time user modifies crust type, e.g. user 'continentDrawing' or 'continentErasing'.
    if (model) {
      markIslands(model.plates);
    }
  } else if (data.type === "restoreSnapshot") {
    let serializedModel: ISerializedModel | null = null;
    if (initialSnapshot && snapshots.length === 0) {
      serializedModel = initialSnapshot;
    } else if (snapshots.length > 0) {
      serializedModel = snapshots.pop() as ISerializedModel;
      if (model && snapshots.length > 0 && model.stepIdx < serializedModel.stepIdx + 20) {
        // Make sure that it's possible to step more than just one step. Restore even earlier snapshot if the last
        // snapshot is very close the current model state. It's similar to << buttons in audio players - usually
        // it just goes to the beginning of a song, but if you hit it again quickly, it will switch to the previous song.
        serializedModel = snapshots.pop() as ISerializedModel;
      }
    }
    if (serializedModel) {
      self.m = model = Model.deserialize(serializedModel);
    }
  } else if (data.type === "restoreInitialSnapshot") {
    if (initialSnapshot) {
      self.m = model = Model.deserialize(initialSnapshot);
      snapshots.length = 0;
    }
  } else if (data.type === "takeLabeledSnapshot") {
    if (model) {
      labeledSnapshots[data.label] = model.serialize();
    }
  } else if (data.type === "restoreLabeledSnapshot") {
    const storedModel = labeledSnapshots[data.label];
    if (storedModel) {
      self.m = model = Model.deserialize(storedModel);
    }
  } else if (data.type === "saveModel") {
    // Stringify model as it seems to greatly improve overall performance of saving (together with Firebase saving).
    self.postMessage({ type: "savedModel", data: { savedModel: JSON.stringify(model?.serialize()) } });
  } else if (data.type === "markField") {
    const pos = (new THREE.Vector3()).copy(data.props.position as THREE.Vector3);
    const field = model?.topFieldAt(pos, { visibleOnly: true });
    if (field) {
      field.marked = true;
    }
  } else if (data.type === "unmarkAllFields") {
    model?.forEachField((field: Field) => {
      field.marked = false;
    });
  } else if (data.type === "setPlateProps") {
    const plate = model?.getPlate(data.props.id);
    if (plate) {
      if (data.props.visible !== undefined) {
        plate.visible = data.props.visible;
      }
    }
  }
  forceRecalcOutput = true;
};

workerFunction();

// Preload Grid helper class. It takes a few seconds to create, so it's better to do it as soon as possible,
// using the time that the main thread needs to load preset image.
getGrid();
