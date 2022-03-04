import config from "../../config";
import Field from "../field";
import Plate from "../plate";

const BASIC_DRAG_FORCE_MOD = 0.000001 * config.friction;
// Note that OROGENY_FORCE_MOD also includes config.friction.
const OROGENY_FORCE_MOD = 0.000001 * config.friction / config.orogenyStrength;

// Basic drag force of the tectonic plate. It's very small, but it keeps model stable.
export function basicDrag(field: Field) {
  const k = (config.constantHotSpots ? -0.15 : -0.0005) * field.area * BASIC_DRAG_FORCE_MOD;
  return field.linearVelocity.clone().multiplyScalar(k);
}

// Drag force between given field and other plate when orogeny is undergoing.
// It's applied when two continents collide (or when continent gets stuck at the ocean's border).
export function orogenicDrag(field: Field, plate: Plate) {
  const force = field.linearVelocity.sub(plate.linearVelocity(field.absolutePos));
  const forceLen = force.length();
  if (forceLen > 0) {
    // Tweak force a bit in "constant base torque" mode.
    const exp = config.constantHotSpots ? 0.3 : 0.5;
    let mod = 1;
    if (field.subduction) {
      // When field is subducting deeper and deeper, this will increase forces.
      mod = 1 + field.subduction.progress * 20;
    }
    force.setLength(-1 * Math.pow(forceLen, exp) * mod);
  }
  force.multiplyScalar(field.area * OROGENY_FORCE_MOD);
  return force;
}
