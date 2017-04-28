import Sphere from '../peels/sphere';
import config from '../config';
import * as THREE from 'three';
import { toCartesian } from '../geo-utils';
import grid from './grid';

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
    this.sphere = new Sphere({divisions: config.divisions});
    this.eulerPole = randomEulerPole();
    this.angularSpeed = 0.0005 * Math.random();
    this.matrix = new THREE.Matrix4();
    this.fields.forEach(field => {
      // Precalculate cartesian coordinates of every field. Assume that sphere has radius = 1 (it doesn't matter).
      field.localPos = toCartesian(field.position);
    });
  }

  get fields() {
    return this.sphere._Fields;
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
    // grid instance provides O(log n) lookup.
    // OPTIMIZATION: it could probably optimized to ~O(1) (Voronoi Sphere + KD Trees).
    const fieldIdx = grid.nearestFieldIdx(localPos);
    return this.fields[fieldIdx];
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
      if (!f.data.active) return;
      f.absolutePos = this.absolutePosition(f.localPos);
      // Reset collision flag, it needs to be recalculated.
      f.data.collision = false;
    });
  }

  detectCollisionWith(plate) {
    this.fields.forEach(f => {
      if (!f.data.active || f.data.collision) return;
      const otherField = plate.fieldAtAbsolutePos(f.absolutePos);
      if (!otherField.data.active) return;
      f.data.collision = true;
      otherField.data.collision = true;
    });
  }

  setField(i) {
    this.fields[i].data = {
      active: true,
      plateId: this.id
    };
  }
}
