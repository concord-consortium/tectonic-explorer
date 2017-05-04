import * as THREE from 'three';
import grid from './grid';
import Field from './field';

let id = 0;
function getId() {
  return id++;
}

function randomEulerPole() {
  const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
  v.normalize();
  return v;
}

export default class Plate {
  constructor({ color }) {
    this.id = getId();
    this.baseColor = color;
    this.eulerPole = randomEulerPole();
    this.angularSpeed = 0.03 * Math.random();
    this.matrix = new THREE.Matrix4();
    this.fields = new Map();
    this.adjacentFields = new Map();
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = this.id;
  }

  addField(id) {
    const field = new Field(id, this);
    this.fields.set(id, field);
    if (this.adjacentFields.has(id)) {
      this.adjacentFields.delete(id);
    }
    field.adjacentFields.forEach(adjFieldId => {
      if (!this.fields.has(adjFieldId)) {
        this.addAdjacentField(adjFieldId)
      } else {
        const adjField = this.fields.get(adjFieldId);
        adjField.border = adjField.isBorder();
      }
    });
    field.border = field.isBorder();
  }

  deleteField(id) {
    const field = this.fields.get(id);
    this.fields.delete(id);
    this.addAdjacentField(id);
    field.adjacentFields.forEach(adjFieldId => {
      let adjField = this.adjacentFields.get(adjFieldId);
      if (adjField && !adjField.isAdjacentField()) {
        this.adjacentFields.delete(adjFieldId);
      }
      adjField = this.fields.get(adjFieldId);
      if (adjField) {
        adjField.border = true;
      }
    });
  }

  addAdjacentField(id) {
    if (!this.adjacentFields.has(id)) {
      this.adjacentFields.set(id, new Field(id, this));
    }
  }

  neighboursCount(absolutePos) {
    const localPos = this.localPosition(absolutePos);
    const id = grid.nearestFieldId(localPos);
    let count = 0;
    grid.fields[id].adjacentFields.forEach(adjId => {
      if (this.fields.has(adjId)) {
        count += 1;
      }
    });
    return count;
  }

  addNewOceanAt(absolutePos) {
    const localPos = this.localPosition(absolutePos);
    let id = grid.nearestFieldId(localPos);
    if (!this.fields.has(id)) {
      this.addField(id);
    }
  }

  // Returns absolute position of a field in cartesian coordinates (it applies plate rotation).
  absolutePosition(localPos) {
    const pos = localPos.clone();
    pos.applyMatrix4(this.matrix);
    return pos;
  }

  // Returns local position.
  localPosition(absolutePos) {
    const invMatrix = (new THREE.Matrix4()).getInverse(this.matrix);
    const pos = absolutePos.clone();
    pos.applyMatrix4(invMatrix);
    return pos;
  }

  fieldAtAbsolutePos(absolutePos) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = grid.nearestFieldId(this.localPosition(absolutePos));
    return this.fields.get(fieldId);
  }

  rotate(timestep) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.eulerPole, this.angularSpeed * timestep);
    rotationMatrix.multiply(this.matrix);
    this.matrix = rotationMatrix;
  }

  updateFields(timestep) {
    this.fields.forEach(f => {
      f.update(timestep);
      if (!f.alive) {
        this.deleteField(f.id);
      }
    });
    this.adjacentFields.forEach(f => {
      f.update(timestep);
    });
  }
}
