const FORCE_FACTOR = 0.3;

// Viscous force between given field and other plate. It's applied when two continents collide (or when continent
// gets stuck at the ocean's border).
export default function viscousForce(field, plate) {
  const force = field.linearVelocity.sub(plate.linearVelocity(field.absolutePos));
  let forceLen = force.length();
  if (forceLen > 0) {
    return force.setLength(-1 * FORCE_FACTOR);
  }
  // (0,0,0) vector would work too, but null value can be used for optimization (some calculations can be skipped later).
  return null;
}
