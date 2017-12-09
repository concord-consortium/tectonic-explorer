// Converts state JSON created using an old version of the app to the most recent one.
// Ensures that the app is backward compatible.

function convertVer0toVer1 (stateVer0) {
  console.log('[migrations] state migration: v0 -> v1')
  // Format has changed between version 0 and 1.
  // Model is now stored under modelState property and there is a new appState too.
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
  }
}

const migrations = {
  0: convertVer0toVer1
  // In the future (in case of need):
  // 2: convertVer1toVer2
  // etc.
}

export default function migrateState (state) {
  let version = state.version || 0
  console.log('[migrations] data version:', version)
  while (migrations[version]) {
    state = migrations[version](state)
    version = state.version
  }
  return state
}
