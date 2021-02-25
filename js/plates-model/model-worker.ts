import * as THREE from "three";
import presets from "../presets";
import modelOutput from "./model-output";
import plateDrawTool from "./plate-draw-tool";
import markIslands from "./mark-islands";
import Model from "./model";
import config from "../config";

const MAX_SNAPSHOTS_COUNT = 30;
let model: any = null;
let props: any = {};
let forceRecalcOutput = false;
let initialSnapshot: any = null;
const snapshots: any[] = [];
const labeledSnapshots: Record<string, any> = {};

function step(forcedStep = false) {
  if (!model) {
    return;
  }
  let recalcOutput = false;
  // stopAfter is mostly used for automated tests.
  const stoppedByUrlParam = model.stepIdx > 0 && model.stepIdx % config.stopAfter === 0;
  if ((props.playing && !stoppedByUrlParam) || forcedStep) {
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
    const data: any = modelOutput(model, props, forceRecalcOutput);
    // postMessage let you specify "transferable objects". Those objects won't be serialized, but passed by reference
    // instead. It's possible to do it only for a few object types (e.g. ArrayBuffer).
    const transferableObjects: any = [];
    data.plates.forEach((plate: any) => {
      const fields = plate.fields;
      if (fields) {
        for (const key in fields) {
          const propertyArray = fields[key];
          transferableObjects.push(propertyArray.buffer);
        }
      }
    });
    (self as any).postMessage({ type: "output", data }, transferableObjects);
    forceRecalcOutput = false;
  }
}

function workerFunction() {
  // Make sure that model doesn't calculate more than 30 steps per second (it can happen on fast machines).
  setTimeout(workerFunction, config.benchmark ? 0 : 33);
  step();
}

self.onmessage = function modelWorkerMsgHandler(event: any) {
  const data = event.data;
  if (data.type === "loadPreset") {
    // Export model to global m variable for convenience.
    (self as any).m = model = new Model(data.imgData, presets[data.presetName].init);
    props = data.props;
  } else if (data.type === "loadModel") {
    const deserializedModel = Model.deserialize(JSON.parse(data.serializedModel));
    // The model may have been stored mid-run, so reset it to ensure it is properly initialized
    deserializedModel.time = 0;
    deserializedModel.stepIdx = 0;
    (self as any).m = model = deserializedModel;
    props = data.props;
  } else if (data.type === "unload") {
    (self as any).m = model = null;
    initialSnapshot = null;
    snapshots.length = 0;
    (self as any).postMessage({ type: "output", data: modelOutput(null) });
  } else if (data.type === "props") {
    props = data.props;
  } else if (data.type === "stepForward") {
    step(true);
  } else if (data.type === "setHotSpot") {
    const pos = (new THREE.Vector3()).copy(data.props.position);
    const force = (new THREE.Vector3()).copy(data.props.force);
    model.setHotSpot(pos, force);
  } else if (data.type === "setDensities") {
    model.setDensities(data.densities);
  } else if (data.type === "fieldInfo") {
    const pos = (new THREE.Vector3()).copy(data.props.position);
    console.log(model.topFieldAt(pos));
  } else if (data.type === "continentDrawing" || data.type === "continentErasing") {
    const pos = (new THREE.Vector3()).copy(data.props.position);
    const clickedField = model.topFieldAt(pos);
    if (clickedField) {
      plateDrawTool(clickedField.plate, clickedField.id, data.type === "continentDrawing" ? "continent" : "ocean");
    }
  } else if (data.type === "markIslands") {
    // This should be called each time user modifies crust type, e.g. user 'continentDrawing' or 'continentErasing'.
    markIslands(model.plates);
  } else if (data.type === "restoreSnapshot") {
    let serializedModel;
    if (snapshots.length === 0) {
      serializedModel = initialSnapshot;
    } else {
      serializedModel = snapshots.pop();
      if (snapshots.length > 0 && model.stepIdx < serializedModel.stepIdx + 20) {
        // Make sure that it's possible to step more than just one step. Restore even earlier snapshot if the last
        // snapshot is very close the current model state. It's simialr to << buttons in audio players - usually
        // it just goes to the beginning of a song, but if you hit it again quickly, it will switch to the previous song.
        serializedModel = snapshots.pop();
      }
    }
    (self as any).m = model = Model.deserialize(serializedModel);
  } else if (data.type === "restoreInitialSnapshot") {
    (self as any).m = model = Model.deserialize(initialSnapshot);
    snapshots.length = 0;
  } else if (data.type === "takeLabeledSnapshot") {
    labeledSnapshots[data.label] = model.serialize();
  } else if (data.type === "restoreLabeledSnapshot") {
    const storedModel = labeledSnapshots[data.label];
    if (storedModel) {
      (self as any).m = model = Model.deserialize(storedModel);
    }
  } else if (data.type === "saveModel") {
    // Stringify model as it seems to greatly improve overall performance of saving (together with Firebase saving).
    (self as any).postMessage({ type: "savedModel", data: { savedModel: JSON.stringify(model.serialize()) } });
  } else if (data.type === "markField") {
    const pos = (new THREE.Vector3()).copy(data.props.position);
    const field = model.topFieldAt(pos);
    if (field) {
      field.marked = true;
    }
  } else if (data.type === "unmarkAllFields") {
    model.forEachField((field: any) => {
      field.marked = false;
    });
  }
  forceRecalcOutput = true;
};

workerFunction();
