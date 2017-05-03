import * as THREE from 'three';
import grid from './grid';
import c from '../constants';

// We use unit sphere (radius = 1) for calculations, so scale constants.
const maxSubductionDist = c.subductionMaxDist / c.earthRadius;

export default class Field {
  constructor(id, plate) {
    this.id = id;
    this.plate = plate;
    this.alive = true;
    this.localPos = grid.fields[id].localPos;
    this.adjacentFields = grid.fields[id].adjacentFields;
    this.border = false;

    this.prevAbsolutePos = null;
    this.absolutePos = this.plate.absolutePosition(this.localPos);
    this.displacement = new THREE.Vector3(0, 0, 0);
    this.collision = false;

    // Used by adjacent fields only:
    this.noCollisionDist = 0;

    this.subduction = null;
  }

  isBorder() {
    // At least one adjacent field of this field is an adjacent field of the whole plate.
    for (let adjId of this.adjacentFields) {
      if (this.plate.adjacentFields.has(adjId)) {
        return true;
      }
    }
    return false;
  }

  isAdjacentField() {
    // At least one adjacent field of this field belongs to the plate.
    for (let adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        return true;
      }
    }
    return false;
  }

  // Number of adjacent fields that actually belong to the plate.
  neighboursCount() {
    let count = 0;
    for (let adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        count += 1;
      }
    }
    return count;
  }

  get density() {
    return this.plate.density;
  }

  update() {
    this.prevAbsolutePos = this.absolutePos;
    this.absolutePos = this.plate.absolutePosition(this.localPos);
    // Of course it's not fully correct, as great-circle distance should be used. But displacements are so small,
    // that it's a reasonable approximation and it doesn't really matter for the simulation.
    this.displacement = this.absolutePos.clone().sub(this.prevAbsolutePos);

    if (this.subduction && this.collision) {
      // Continue subduction.
      this.subduction.dist += this.subduction.relativeDisplacement;
      if (this.subduction.dist > maxSubductionDist) {
        this.alive = false;
      }
    } else if (this.subduction && !this.collision) {
      // Revert subduction if there's no collision.
      this.subduction.dist -= this.displacement.length();
      if (this.subduction.dist <= 0) {
        this.subduction = null;
      }
    }

    // Reset per-step collision flag.
    this.collision = false;
  }

  collideWith(field) {
    if (this.border && field.border) {
      // Skip collision between field at border, so simulation looks a bit cleaner.
      return;
    }
    // const posDiff = this.absolutePos.clone().sub(field.absolutePos);
    // const dispDiff = this.displacement.clone().sub(field.displacement);
    // const convergent = posDiff.angleTo(dispDiff) > Math.PI * 0.25;
    this.collision = true;
    if (!this.subduction && this.density < field.density) {
      this.subduction = {
        topPlateId: field.plate.id,
        dist: 0
      };
    }
    if (this.subduction && this.subduction.topPlateId === field.plate.id) {
      // Update relative displacement only if we're still under the same plate. Otherwise, just keep previous value.
      this.subduction.relativeDisplacement = this.displacement.distanceTo(field.displacement)
    }
  }
}
