import * as THREE from 'three';
import grid from './grid';
import Field from './field';

let id = 0;
function getId() {
  return id++;
}

const friction = 0.1;

export default class Plate {
  constructor({ color }) {
    this.id = getId();
    this.baseColor = color;
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.angularAcceleration = new THREE.Vector3(0, 0, 0);
    this.baseTorques = [];
    this.momentOfInertia = 1000;
    this.matrix = new THREE.Matrix4();
    this.fields = new Map();
    this.adjacentFields = new Map();
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = this.id;
  }

  get angularSpeed() {
    return this.angularVelocity.length();
  }

  // Euler pole.
  get axisOfRotation() {
    if (this.angularSpeed === 0) {
      // Return anything, plate is not moving anyway.
      return new THREE.Vector3(1, 0, 0);
    }
    return this.angularVelocity.clone().normalize();
  }

  addTorque(pos, force) {
    this.baseTorques.push(pos.clone().cross(force));
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

  halfUpdateVelocity(timestep) {
    this.angularVelocity.x += 0.5 * this.angularAcceleration.x * timestep;
    this.angularVelocity.y += 0.5 * this.angularAcceleration.y * timestep;
    this.angularVelocity.z += 0.5 * this.angularAcceleration.z * timestep;
  }

  updateRotation(timestep) {
    const angleDiff = this.angularSpeed * timestep;
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.axisOfRotation, angleDiff);
    rotationMatrix.multiply(this.matrix);
    this.matrix = rotationMatrix;
  }

  updateAcceleration() {
    const totalTorque = new THREE.Vector3(0, 0, 0);
    this.baseTorques.forEach(torque => totalTorque.add(torque));
    const acceleration = totalTorque.divideScalar(this.momentOfInertia);
    const frictionAcceleration = this.angularVelocity.clone().multiplyScalar(-friction);
    this.angularAcceleration.addVectors(acceleration, frictionAcceleration);
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

  addField(id, type, elevation) {
    const field = new Field({id, plate: this, type, elevation});
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
      this.adjacentFields.set(id, new Field({id, plate: this}));
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
      this.addField(id, 'ocean');
    }
  }
}
