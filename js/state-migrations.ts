// Converts state JSON created using an old version of the app to the most recent one.
// Ensures that the app is backward compatible.

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

const migrations: Record<number, (state: any) => any> = {
  0: convertVer0toVer1,
  1: convertVer1toVer2
  // In the future (in case of need):
  // 2: convertVer1toVer2
  // etc.
};

export default function migrateState(state: any) {
  let version = state.version || 0;
  console.log("[migrations] initial data version:", version);
  while (migrations[version]) {
    state = migrations[version](state);
    version = state.version;
  }
  return state;
}
