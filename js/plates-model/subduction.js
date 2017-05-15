import c from '../constants';

// We use unit sphere (radius = 1) for calculations, so scale constants.
const maxSubductionDist = c.subductionWidth / c.earthRadius;

// Set of properties related to subduction. Used by Field instances.
export default class Subduction {
  constructor(topPlateId) {
    this.topPlateId = topPlateId;
    this.dist = 0;
    this.relativeDisplacement = 0;
    this.active = true;
    this.complete = false;
  }

  update(collision, displacement) {
    // Subduction update.
    if (collision) {
      // Continue subduction.
      this.dist += this.relativeDisplacement;
      if (this.dist > maxSubductionDist) {
        this.complete = true;
      }
    } else {
      // Slowly revert subduction if there's no collision.
      this.dist -= displacement.length();
      if (this.dist <= 0) {
        this.active = false;
      }
    }
  }
}

