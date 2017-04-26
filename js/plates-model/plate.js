import Sphere from '../peels/sphere';
import config from './config';
import * as THREE from 'three';

let id = 0;
function getId() {
  return id++;
}

export default class Plate {
  constructor() {
    this.id = getId();
    this.sphere = new Sphere({divisions: config.divisions});
    this.eulerPole = new THREE.Vector3(0, 1, 0);
    this.angularSpeed = 0.1;
    this.matrix = new THREE.Matrix4();
  }

  setField(i) {
    this.sphere._Fields[i].data = {
      plateId: this.id,
    };
  }
}
