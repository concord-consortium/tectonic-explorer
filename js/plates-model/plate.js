import Sphere from '../peels/sphere';
import config from '../config';
import * as THREE from 'three';

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
  }

  move(timestep) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.eulerPole, this.angularSpeed * timestep);
    rotationMatrix.multiply(this.matrix);
    this.matrix = rotationMatrix;
  }

  setField(i) {
    this.sphere._Fields[i].data = {
      plateId: this.id
    };
  }
}
