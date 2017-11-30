import seedrandom from 'seedrandom'

const SEED = 'PlateTectonics3D'
let rand = null

export function initialize (deterministic) {
  rand = seedrandom(SEED, { state: true, entropy: !deterministic })
}

export function initializeFromState (state) {
  rand = seedrandom('', { state })
}

export function getState () {
  return rand.state()
}

export function random () {
  return rand()
}
