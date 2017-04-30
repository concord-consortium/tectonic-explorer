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
  constructor() {
    this.id = getId();
    this.eulerPole = randomEulerPole();
    this.angularSpeed = 0.0005 * Math.random();
    this.matrix = new THREE.Matrix4();
    this.fields = new Map();
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = this.id;
  }

  addField(id) {
    this.fields.set(id, new Field(id, this));
  }

  addNewOceanAt(absolutePos) {
    const localPos = this.localPosition(absolutePos);
    let id = grid.nearestFieldId(localPos);
    if (this.fields.has(id)) {
      // TODO what happens here?
    } else {
      this.fields.set(id, new Field(id, this));
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

  fieldAtLocalPos(localPos) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = grid.nearestFieldId(localPos);
    return this.fields.get(fieldId);
  }

  fieldAtAbsolutePos(absolutePos) {
    const localPos = this.localPosition(absolutePos);
    return this.fieldAtLocalPos(localPos);
  }

  rotate(delta) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.eulerPole, this.angularSpeed * delta);
    rotationMatrix.multiply(this.matrix);
    this.matrix = rotationMatrix;
  }

  updateFields() {
    this.fields.forEach(f => {
      f.update();
      if (!f.alive) {
        this.fields.delete(f.id);
      }
    });
  }
}
