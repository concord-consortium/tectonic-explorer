import generatePlates from './generate-plates';
import grid from './grid';

function sortByDensityDesc(plateA, plateB) {
  return plateB.density - plateA.density;
}

export default class Model {
  constructor(preset) {
    this.plates = generatePlates(preset);
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
          this.gridMapping[i] = [plate];
          break;
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
    this.handleCollisions();
    this.generateNewFieldsUsingGridMapping();
  }

  handleCollisions() {
    this.plates.forEach(plate => {
      this.plates.forEach(otherPlate => {
        if (plate !== otherPlate) {
          plate.detectCollisionWith(otherPlate);
        }
      });
    });
  }

  generateNewFieldsUsingGridMapping() {
    for (let i = 0, len = grid.size; i < len; i += 1) {
      if (!this.gridMapping[i] && this.prevGridMapping[i]) {
        // There's no plate at field[i], but there used to be one step earlier. Add new field to the same plate
        // that was there. It ensures that divergent boundaries will stay in place.
        let prevPlates = this.prevGridMapping[i];
        if (prevPlates.length > 1) {
          // console.warn('unexpected: note sure which plate to generate');
        }
        const prevPlate = prevPlates[0];
        prevPlate.addNewOceanAt(grid.fields[i].localPos);
      }
    }
  }
}
