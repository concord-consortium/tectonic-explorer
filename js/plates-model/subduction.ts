import * as THREE from "three";
import c from "../constants";
import Field, { FieldWithSubduction } from "./field";
import getGrid from "./grid";
import Plate from "./plate";

export interface ISerializedSubduction {
  dist: number;
  // There's no need to serialize .relativeVelocity and .topPlate, they're reset at the end of simulation step.
}

// We use unit sphere (radius = 1) for calculations, so scale constants.
export const MAX_SUBDUCTION_DIST = c.subductionWidth / c.earthRadius;
// When subducing area of the plate is being pulled in the other direction and it's not covered by anything else,
// we need to revert subduction. This value defines how fast it happens.
const REVERT_SUBDUCTION_VEL = -10;

const MIN_PROGRESS_TO_DETACH = 0.3;
const MIN_SPEED_TO_DETACH = 0.0005;
const MIN_ANGLE_TO_DETACH = Math.PI * 0.55;

export const MIN_PROGRESS = 0;

// Set of properties related to subduction. Used by Field instances.
export default class Subduction {
  dist: number;
  field: Field;
  relativeVelocity?: THREE.Vector3;
  topPlate?: Plate;

  constructor(field: Field) {
    this.field = field;
    this.dist = 0;
    this.topPlate = undefined;
    this.relativeVelocity = undefined;
  }

  serialize(): ISerializedSubduction {
    return {
      dist: this.dist
    };
  }

  static deserialize(props: ISerializedSubduction, field: Field) {
    const s = new Subduction(field);
    s.dist = props.dist;
    return s;
  }

  get progress() {
    return Math.min(1, MIN_PROGRESS + Math.pow(this.dist / MAX_SUBDUCTION_DIST, 2));
  }

  get active() {
    return this.dist >= 0;
  }

  get avgProgress() {
    let sum = 0;
    let count = 0;
    this.forEachSubductingNeighbor((otherField) => {
      sum += otherField.subduction.progress || 0;
      count += 1;
    });
    if (count > 0) {
      return sum / count;
    }
    return 0;
  }

  forEachSubductingNeighbor(callback: (field: FieldWithSubduction) => void) {
    this.field.forEachNeighbor((otherField: Field) => {
      if (otherField.subduction) {
        callback(otherField as FieldWithSubduction);
      }
    });
  }

  calcSlabGradient() {
    let count = 0;
    const gradient = new THREE.Vector3();
    this.forEachSubductingNeighbor((otherField: FieldWithSubduction) => {
      const progressDiff = otherField.subduction.avgProgress - this.avgProgress;
      gradient.add(otherField.absolutePos.clone().sub(this.field.absolutePos).multiplyScalar(progressDiff));
      count += 1;
    });
    if (count > 4) {
      // Require at least 5 neighbors, as otherwise gradient might not be reliable.
      return gradient.normalize();
    } else {
      return null;
    }
  }

  setCollision(field: Field) {
    if (!field.plate.isSubplate) {
      this.topPlate = field.plate;
      this.relativeVelocity = this.field.linearVelocity.clone().sub(field.linearVelocity);
    } else {
      console.warn("Unexpected collision with subplate");
    }
  }

  resetCollision() {
    this.topPlate = undefined;
    // Start opposite process. If there's still collision, it will overwrite this value again with positive speed.
    this.relativeVelocity = undefined;
  }

  getMinNeighboringSubductionDist() {
    let min = Infinity;
    this.field.forEachNeighbor((neigh: Field) => {
      const dist = neigh.subduction ? neigh.subduction.dist : 0;
      if (dist < min) {
        min = dist;
      }
    });
    return min;
  }

  update(timestep: number) {
    // Continue subduction. Make sure that subduction progress isn't too different from neighboring fields.
    // It might happen next to transform-like boundaries where plates move almost parallel to each other.
    const diff = this.relativeVelocity ? this.relativeVelocity.length() * timestep : REVERT_SUBDUCTION_VEL;
    this.dist = Math.min(this.getMinNeighboringSubductionDist() + getGrid().fieldDiameter, this.dist + diff);
    if (this.dist > MAX_SUBDUCTION_DIST) {
      this.field.alive = false;
    }
    // This is a bit incorrect. tryToDetachFromPlate depends on neighboring fields subduction progress.
    // It should be called after all the update() calls are made. However, it shouldn't have significant impact
    // on the simulation and simplifies code a bit.
    this.tryToDetachFromPlate();
  }

  tryToDetachFromPlate() {
    // It can happen when new velocity is very different from slab elevation gradient. E.g. when plate is moving
    // in the opposite direction than it used to.
    if (!this.topPlate || this.progress < MIN_PROGRESS_TO_DETACH) {
      return;
    }
    const slabGradient = this.calcSlabGradient();
    if (this.relativeVelocity && this.relativeVelocity.length() > MIN_SPEED_TO_DETACH &&
      slabGradient && slabGradient.angleTo(this.relativeVelocity) > MIN_ANGLE_TO_DETACH) {
      this.moveToTopPlate();
      this.forEachSubductingNeighbor(otherField => {
        otherField.subduction.moveToTopPlate();
      });
    }
  }

  moveToTopPlate() {
    if (this.topPlate) {
      this.topPlate.addToSubplate(this.field);
    }
  }
}
