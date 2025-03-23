import * as THREE from "three";
// Converts state JSON created using an old version of the app to the most recent one.
// Ensures that the app is backward compatible.

type MigrationResult = any | "incompatibleModel";

const LATEST_V1_URL = "https://tectonic-explorer.concord.org/version/v1.4.4/index.html";

// Model is now stored under modelState property and there is a new appState too.
function convertVer0toVer1(stateVer0: any) {
  console.log("[migrations] state migration: v0 -> v1");
  return {
    version: 1,
    modelState: stateVer0,
    appState: {
      // Provide default values for app state.
      showCrossSectionView: false,
      crossSectionPoint1: null,
      crossSectionPoint2: null,
      crossSectionCameraAngle: 0,
      mainCameraPos: [4.5, 0, 0]
    }
  };
}

// plate.baseColor => plate.hue
// field.originalColor => field.originalHue
function convertVer1toVer2(stateVer1: any) {
  console.time("[migrations] state migration: v1 -> v2");
  const model = JSON.parse(stateVer1.modelState);
  model.plates.forEach((plate: any) => {
    plate.hue = plate.baseColor.h;
    plate.fields.forEach((field: any) => {
      field.originalHue = field.originalColor?.h;
    });
  });
  const newState = stateVer1;
  newState.version = 2;
  newState.modelState = JSON.stringify(model);
  console.timeEnd("[migrations] state migration: v1 -> v2");
  return newState;
}

function convertVer2toVer3(stateVer2: any) {
  console.time("[migrations] state migration: v2 -> v3");
  const model = JSON.parse(stateVer2.modelState);
  model.plates.forEach((plate: any) => {
    plate.quaternion = plate.quaternion.array;
    plate.angularVelocity = plate.angularVelocity.array;
    plate.invMomentOfInertia = plate.invMomentOfInertia.array;
    plate.center = plate.center?.array || null;
    plate.hotSpot.force = plate.hotSpot.force.array;
    plate.hotSpot.position = plate.hotSpot.position.array;
  });
  const newState = stateVer2;
  newState.version = 3;
  newState.modelState = JSON.stringify(model);
  console.timeEnd("[migrations] state migration: v2 -> v3");
  return newState;
}

// state version 3
function convertVer3toVer4(stateVer3: any) {
  // It's not possible to load a state saved in Tectonic Explorer V1.x in Tectonic Explorer V2.x.
  // Version 2.x is not backward compatible with version 1.x. There are multiple new features that cannot be restored
  // from an old state format. Simply redirect to the last 1.x version.
  window.location.replace(LATEST_V1_URL + window.location.search);
  return "incompatibleModel";
}

// missing momentOfInertia property, it can be calculated from invMomentOfInertia
function convertVer4toVer5(stateVer4: any) {
  console.time("[migrations] state migration: v4 -> v5");
  const model = JSON.parse(stateVer4.modelState);
  model.plates.forEach((plate: any) => {
    const momentOfInertia = (new THREE.Matrix3()).fromArray(plate.invMomentOfInertia);
    momentOfInertia.invert();
    plate.momentOfInertia = momentOfInertia.toArray();
  });
  const newState = stateVer4;
  newState.version = 5;
  newState.modelState = JSON.stringify(model);
  console.timeEnd("[migrations] state migration: v4 -> v5");
  return newState;
}

const migrations: Record<number, (state: any) => any> = {
  0: convertVer0toVer1,
  1: convertVer1toVer2,
  2: convertVer2toVer3,
  3: convertVer3toVer4,
  4: convertVer4toVer5,
  // In the future (in case of need):
  // 3: convertVer3toVer4
  // etc.
};

export default function migrateState(state: any): MigrationResult {
  let version = state.version || 0;
  console.log("[migrations] initial data version:", version);
  while (migrations[version]) {
    state = migrations[version](state);
    version = state.version;
  }
  return state;
}
