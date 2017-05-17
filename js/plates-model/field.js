import * as THREE from 'three';
import grid from './grid';
import c from '../constants';
import Subduction from './subduction';
import Orogeny from './orogeny';
import VolcanicActivity from './volcanic-activity';

// We use unit sphere (radius = 1) for calculations, so scale constants.
const maxSubductionDist = c.subductionWidth / c.earthRadius;
// Max time that given field can undergo orogeny or volcanic activity.
const maxDeformingTime = 15; // s

const defaultElevation = {
  ocean: 0.25,
  // sea level: 0.5
  continent: 0.55
};

export default class Field {
  constructor({ id, plate, type = 'ocean', elevation = null }) {
    this.id = id;
    this.plate = plate;
    this.alive = true;
    this.localPos = grid.fields[id].localPos;
    this.adjacentFields = grid.fields[id].adjacentFields;
    this.border = false;

    this.isOcean = type === 'ocean';
    this.baseElevation = elevation || defaultElevation[type];
    this.island = false;

    this.prevAbsolutePos = null;
    this.absolutePos = this.plate.absolutePosition(this.localPos);
    this.displacement = new THREE.Vector3(0, 0, 0);
    this.collision = false;

    // When field undergoes orogeny or volcanic activity, this attribute is going lower and lower
    // and at some point field will be "frozen" won't be able to undergo any more processes.
    // It ensures that mountains don't grow too big and there's some variation between fields.
    this.deformingCapacity = maxDeformingTime;
    this.orogeny = null;
    this.volcanicAct = null;
    this.subduction = null;

    // Used by adjacent fields only:
    this.noCollisionDist = 0;
  }

  get linearVelocity() {
    // angular velocity x r
    return this.plate.angularVelocity.clone().cross(this.absolutePos);
  }

  get force() {
    if (!this.orogeny) {
      return null;
    }
    return this.orogeny.force;
  }

  get torque() {
    if (!this.orogeny) {
      return null;
    }
    return this.absolutePos.clone().cross(this.force);
  }

  get isContinent() {
    return !this.isOcean;
  }

  get elevation() {
    let modifier = 0;
    if (this.isOcean) {
      if (this.island) {
        modifier = defaultElevation.continent - this.baseElevation;
      }
      if (this.orogeny && this.orogeny.field2) {
        // Special case. Ocean goes "over" continent. Plates should stop much faster and ocean should reflect
        // continents topography.
        return this.orogeny.field2.elevation;
      }
    } else {
      const volcano = this.volcanicAct && this.volcanicAct.value || 0;
      const mountain = this.orogeny && this.orogeny.foldingStress || 0;
      modifier += 0.4 * Math.max(volcano, mountain);
    }
    return Math.min(1, this.baseElevation + modifier);
  }

  isOverlapping(field) {
    return this.absolutePos.distanceTo(field.absolutePos) <= grid.fieldDiameter;
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

  update(timestep) {
    this.prevAbsolutePos = this.absolutePos;
    this.absolutePos = this.plate.absolutePosition(this.localPos);
    // Of course it's not fully correct, as great-circle distance should be used. But displacements are so small,
    // that it's a reasonable approximation and it doesn't really matter for the simulation.
    this.displacement = this.absolutePos.clone().sub(this.prevAbsolutePos);

    if (this.subduction) {
      this.subduction.update(this.collision, this.displacement);
      if (this.subduction.complete) {
        this.alive = false;
      }
      if (!this.subduction.active) {
        this.subduction = null;
      }
    }

    if (this.orogeny) {
      this.orogeny.update(timestep);
    }

    if (this.deformingCapacity > 0) {
      if (this.volcanicAct && this.volcanicAct.active) {
        this.volcanicAct.update(timestep);
        this.deformingCapacity -= timestep;
        if (this.isOcean && Math.random() < this.volcanicAct.islandProbability * timestep) {
          this.island = true;
        }
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
    this.collision = true;

    if (this.isOcean && this.density < field.density) {
      if (!this.subduction) {
        this.subduction = new Subduction(field.plate.id);
      }
      if (this.subduction.topPlateId === field.plate.id) {
        // Update relative displacement only if we're still under the same plate. Otherwise, just keep previous value.
        this.subduction.relativeDisplacement = this.displacement.distanceTo(field.displacement)
      }
    } else if (this.density >= field.density && field.subduction) {
      // Volcanic activity is the strongest in the middle of subduction distance / progress.
      let r = field.subduction.dist / maxSubductionDist;
      if (r > 0.5) r = 1 - r;
      // Magic number 0.43 ensures that volcanoes get visible enough. If it's lower, they don't grow enough,
      // if it's bigger, they get too big and too similar to each other.
      r = r / (maxDeformingTime * 0.43);
      if (!this.volcanicAct) {
        this.volcanicAct = new VolcanicActivity();
      }
      this.volcanicAct.active = true;
      this.volcanicAct.speed = r;
    } else if (this.isContinent && field.isContinent ||
                // Special case, ocean might go over continent, but both plates should stop much faster:
               field.isContinent && this.density >= field.density ||
               this.isContinent && this.density < field.density
    ) {
      if (!this.orogeny) {
        this.orogeny = new Orogeny(this, field);
      } else {
        this.orogeny.field2 = field;
      }
    }
  }
}
