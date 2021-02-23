import config from "../../config";

const FORCE_MOD = 0.00002;

// Basic drag force of the tectonic plate. It's very small, but it keeps model stable.
export function basicDrag(field: any) {
  const k = (config.constantHotSpots ? -0.15 : -0.0005) * field.area * FORCE_MOD;
  return field.linearVelocity.clone().multiplyScalar(k);
}

// Drag force between given field and other plate when orogeny is undergoing.
// It's applied when two continents collide (or when continent gets stuck at the ocean's border).
export function orogenicDrag(field: any, plate: any) {
  const force = field.linearVelocity.sub(plate.linearVelocity(field.absolutePos));
  const forceLen = force.length();
  if (forceLen > 0) {
    // Tweak force a bit in "constant base torque" mode.
    const exp = config.constantHotSpots ? 0.3 : 0.5;
    force.setLength(-1 * Math.pow(forceLen, exp));
  }
  force.multiplyScalar(field.area * FORCE_MOD);
  return force;
}
