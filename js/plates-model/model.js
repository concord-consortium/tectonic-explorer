import generatePlates from './generate-plates';
import grid from './grid';
import { euler, rk4, modifiedVerlet } from './integrators';
import config from '../config';

function sortByDensityDesc(plateA, plateB) {
  return plateB.density - plateA.density;
}

function sortBySpeedDesc(plateA, plateB) {
  return plateB.angularVelocity - plateA.angularVelocity;
}

function sortByNeighboursCountDesc(absolutePos) {
  return function (plateA, plateB) {
    return plateB.neighboursCount(absolutePos) - plateA.neighboursCount(absolutePos);
  };
}

export default class Model {
  constructor(imgData, initFunction) {
    this.time = 0;
    this.plates = generatePlates(imgData, initFunction);
    this.gridMapping = [];
    this.prevGridMapping = [];
    for (let i = 0, fieldsCount = grid.size; i < fieldsCount; i += 1) {
      this.prevGridMapping[i] = [];
      this.gridMapping[i] = [];
    }
    this.populateGridMapping();
  }

  step(timestep) {
    if (this.diverged) {
      return;
    }
    if (config.integration === 'euler') {
      euler(this, timestep);
    } else if (config.integration === 'rk4') {
      rk4(this, timestep, false);
    } else if (config.integration === 'rk4full') {
      rk4(this, timestep, true);
    } else if (config.integration === 'verlet') {
      modifiedVerlet(this, timestep);
    }
    this.plates.forEach(plate => {
      plate.applyVelocityDamping(timestep);
      plate.updateBaseTorque(timestep);
    });
    this.time += timestep;
    if (this.kineticEnergy > 500) {
      alert('Model has diverged, time: ' + this.time);
      this.diverged = true;
    }
  }

  simulatePlatesInteractions(timestep) {
    if (config.useGridMapping) {
      // Grid mapping seems to be slower and generates a bit different output.
      this.populateGridMapping();
      this.handleCollisionsUsingGridMapping();
      this.generateNewFieldsUsingGridMapping();
    } else {
      this.handleCollisions();
      this.generateNewFields();
    }
    this.plates.forEach(plate => plate.updateInertiaTensor());
  }

  handleCollisions() {
    this.plates.forEach(plate => {
      this.plates.forEach(otherPlate => {
        if (plate !== otherPlate) {
          plate.fields.forEach(field => {
            const otherField = otherPlate.fieldAtAbsolutePos(field.absolutePos);
            if (otherField) {
              field.collideWith(otherField);
            }
          });
        }
      });
    });
  }

  generateNewFields() {
    const sortedPlates = this.plates.slice().sort(sortBySpeedDesc);
    sortedPlates.forEach(plate => {
      sortedPlates.forEach(otherPlate => {
        if (plate !== otherPlate) {
          plate.adjacentFields.forEach(field => {
            const otherField = otherPlate.fieldAtAbsolutePos(field.absolutePos);
            if (!otherField) {
              field.noCollisionDist += field.displacement.length();
              // Make sure that adjacent field travelled at least distance similar to size of the single field.
              // It ensures that divergent boundaries will stay in place more or less and new crust will be building
              // only when plate is moving.
              if (field.noCollisionDist > grid.fieldDiameter * 0.85) {
                let neighboursCount = field.neighboursCount();
                // Make sure that new field has at least two existing neighbours. It prevents from creating
                // awkward, narrow shapes of the continents.
                if (neighboursCount > 1) {
                  plate.addNewOceanAt(field.absolutePos);
                }
              }
            } else {
              field.noCollisionDist = 0;
            }
          });
        }
      });
    });
  }

  // Grid mapping is another approach to collision detection. I guess it won't be used in the future,
  // but keep it as an option at the moment (sometimes it's useful for experiments or comparision).
  // Faster algorithms might be implemented in the future, e.g. one that assumes that only following
  // fields can collide with other fields:
  // - border fields,
  // - fields that collided in the previous step,
  // - neighbours of fields that collided in the previous step.

  populateGridMapping() {
    const tmp = this.prevGridMapping;
    this.prevGridMapping = this.gridMapping;
    this.gridMapping = tmp;
    const sortedPlates = this.plates.slice().sort(sortByDensityDesc);
    for (let i = 0, fieldsCount = grid.size; i < fieldsCount; i += 1) {
      this.gridMapping[i].length = 0;
      for (let j = 0, platesCount = sortedPlates.length; j < platesCount; j += 1) {
        const plate = sortedPlates[j];
        const field = plate.fieldAtAbsolutePos(grid.fields[i].localPos);
        if (field) {
          if (!this.gridMapping[i]) {
            this.gridMapping[i] = [];
          }
          this.gridMapping[i].push(field);
        }
      }
    }
  }

  handleCollisionsUsingGridMapping() {
    // Collision detection based on grid mapping, probably less accurate as it won't cover all the cells in plates:
    this.gridMapping.forEach((fields, i) => {
      if (fields.length > 1) {
        if (fields[0].plate !== fields[1].plate) {
          fields[0].collideWith(fields[1]);
          fields[1].collideWith(fields[0]);
        }
      }
    });
  }

  generateNewFieldsUsingGridMapping() {
    for (let i = 0, len = grid.size; i < len; i += 1) {
      if (this.gridMapping[i].length === 0 && this.prevGridMapping[i].length > 0) {
        // There's no plate at field[i], but there used to be one step earlier. Add new field to the same plate
        // that was there. It ensures that divergent boundaries will stay in place.
        let prevFields = this.prevGridMapping[i];
        let plates = prevFields.map(f => f.plate);
        if (plates.length > 1) {
          plates.sort(sortByNeighboursCountDesc(grid.fields[i].localPos))
        }
        const prevPlate = plates[0];
        prevPlate.addNewOceanAt(grid.fields[i].localPos);
      }
    }
  }
}
