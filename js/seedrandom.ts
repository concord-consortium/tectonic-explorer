import seedrandom from "seedrandom";

const SEED = "PlateTectonics3D";
let rand: any = null;

export function initialize (deterministic: any) {
  // state: true enables state saving, entropy controls whether random generator is deterministic or not.
  rand = seedrandom(SEED, { state: true, entropy: !deterministic });
}

export function initializeFromState (state: any) {
  // When state is provided, the first argument, seed, is ignored.
  rand = seedrandom("", { state });
}

export function getState () {
  return rand.state();
}

export function random () {
  return rand();
}
