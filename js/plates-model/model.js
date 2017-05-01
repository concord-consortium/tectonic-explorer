import generatePlates from './generate-plates';
import grid from './grid';

function sortByDensityDesc(plateA, plateB) {
  return plateB.density - plateA.density;
}

export default class Model {
  constructor(imgData, initFunction) {
    this.plates = generatePlates(imgData, initFunction);
    this.gridMapping = [];
    this.prevGridMapping = null;
    this.populateGridMapping();
  }

  populateGridMapping() {
    this.prevGridMapping = this.gridMapping;
    this.gridMapping = [];
    const sortedPlates = this.plates.slice().sort(sortByDensityDesc);
    for (let i = 0, fieldsCount = grid.size; i < fieldsCount; i += 1) {
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

  rotatePlates(delta = 1) {
    this.plates.forEach(plate => plate.rotate(delta));
  }

  simulatePlatesInteractions() {
    this.plates.forEach(plate => plate.updateFields());
    this.populateGridMapping();
    this.handleCollisionsUsingGridMapping();
    this.generateNewFieldsUsingGridMapping();
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

  handleCollisions() {
    // Probably more accurate but slower:
    this.plates.forEach(plate => {
      this.plates.forEach(otherPlate => {
        if (plate !== otherPlate) {
          plate.fields.forEach(f => {
            const otherField = otherPlate.fieldAtAbsolutePos(f.absolutePos);
            if (otherField) {
              f.collideWith(otherField);
            }
          });
        }
      });
    });
  }

  generateNewFieldsUsingGridMapping() {
    for (let i = 0, len = grid.size; i < len; i += 1) {
      if (!this.gridMapping[i] && this.prevGridMapping[i]) {
        // There's no plate at field[i], but there used to be one step earlier. Add new field to the same plate
        // that was there. It ensures that divergent boundaries will stay in place.
        let prevFields = this.prevGridMapping[i];
        if (prevFields.length > 1) {
          // console.warn('unexpected: note sure which plate to generate');
        }
        const prevPlate = prevFields[0].plate;
        prevPlate.addNewOceanAt(grid.fields[i].localPos);
      }
    }
  }
}
