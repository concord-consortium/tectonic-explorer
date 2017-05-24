import * as THREE from 'three';
import grid from './grid';
import Field from './field';
import '../three-extensions';

let id = 0;
function getId() {
  return id++;
}

const ANGULAR_DAMPING = 0;
const BASE_TORQUE_DECREASE = 0.2;

export default class Plate {
  constructor({ color }) {
    this.id = getId();
    this.baseColor = color;

    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.baseTorque = new THREE.Vector3(0, 0, 0);
    this.totalTorque = new THREE.Vector3(0, 0, 0);
    this.quaternion = new THREE.Quaternion();

    this.fields = new Map();
    this.adjacentFields = new Map();
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = this.id;

    this.invMomentOfInertia = new THREE.Matrix3();
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

  updateInertiaTensor() {
    let ixx = 0;
    let iyy = 0;
    let izz = 0;
    let ixy = 0;
    let ixz = 0;
    let iyz = 0;
    this.fields.forEach(field => {
      const mass = field.mass;
      const p = field.absolutePos;
      ixx += mass * (p.y * p.y + p.z * p.z);
      iyy += mass * (p.x * p.x + p.z * p.z);
      izz += mass * (p.x * p.x + p.y * p.y);
      ixy -= mass * p.x * p.y;
      ixz -= mass * p.x * p.z;
      iyz -= mass * p.y * p.z;
    });
    const momentOfInertia = new THREE.Matrix3();
    momentOfInertia.set(
      ixx, ixy, ixz,
      ixy, iyy, iyz,
      ixz, iyz, izz
    );
    this.invMomentOfInertia = new THREE.Matrix3();
    this.invMomentOfInertia.getInverse(momentOfInertia);
  }

  linearVelocity(absolutePos) {
    return this.angularVelocity.clone().cross(absolutePos);
  }

  addTorque(pos, force) {
    this.baseTorque = pos.clone().cross(force);
  }

  // Returns absolute position of a field in cartesian coordinates (it applies plate rotation).
  absolutePosition(localPos) {
    return localPos.clone().applyQuaternion(this.quaternion);
  }

  // Returns local position.
  localPosition(absolutePos) {
    return absolutePos.clone().applyQuaternion(this.quaternion.clone().conjugate());
  }

  fieldAtAbsolutePos(absolutePos) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = grid.nearestFieldId(this.localPosition(absolutePos));
    return this.fields.get(fieldId);
  }

  updateVelocity(timestep, acceleration = this.angularAcceleration) {
    this.angularVelocity.add(acceleration.clone().multiplyScalar(timestep));
  }

  applyVelocityDamping(timestep) {
    this.angularVelocity.multiplyScalar(1 / (1 + timestep * ANGULAR_DAMPING));
  }

  updateRotation(timestep, w = this.angularVelocity) {
    const wQuat = new THREE.Quaternion(w.x * timestep, w.y * timestep, w.z * timestep, 0);
    const qDiff = wQuat.multiply(this.quaternion);
    qDiff.multiplyScalar(0.5);
    this.quaternion.add(qDiff);
    this.quaternion.normalize();
  }

  updateBaseTorque(timestep) {
    const len = this.baseTorque.length();
    if (len > 0) {
      this.baseTorque.setLength(Math.max(0, len - timestep * BASE_TORQUE_DECREASE));
    }
  }

  updateAcceleration() {
    this.totalTorque = new THREE.Vector3(0, 0, 0);
    this.totalTorque.add(this.baseTorque);
    this.fields.forEach(field => {
      field.calcForces();
      this.totalTorque.add(field.torque);
    });
    this.angularAcceleration = this.totalTorque.clone().applyMatrix3(this.invMomentOfInertia);
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
