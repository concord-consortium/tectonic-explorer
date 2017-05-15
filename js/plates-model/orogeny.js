import c from '../constants';

// We use unit sphere (radius = 1) for calculations, so scale constants.
const OROGENY_WIDTH = c.orogenyWidth / c.earthRadius;
const FORCE_FACTOR = 0.1;

// Set of properties related to orogenesis. Used by Field instances.
export default class Orogeny {
  constructor(field1, field2) {
    this.field1 = field1;
    this.field2 = field2;
    this.dist = 0;
    this.relativeVelocity = new THREE.Vector3(0, 0, 0);
  }

  get force() {
    const force = this.relativeVelocity.clone();
    const forceLen = force.length();
    if (forceLen > 0) {
      force.setLength(Math.pow(forceLen, 0.3) * FORCE_FACTOR * -1);
    }
    return force;
  }

  get foldingStress() {
    let result = this.dist / OROGENY_WIDTH;
    return Math.min(1, result);
  }

  update(timestep) {
    const { field1, field2 } = this;
    if (field1.isOverlapping(field2)) {
      this.relativeVelocity = field1.linearVelocity.sub(field2.linearVelocity);
      this.dist += this.relativeVelocity.length() * timestep;
    }
  }
}
