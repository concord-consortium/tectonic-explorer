import * as THREE from 'three';

// init function receives hash object with plates, where key is the plate's hue value on the input image.
export default {
  'two-plates': {
    img: 'data/two-plates.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[65]; // 65 hue
      bluePlate.eulerPole = new THREE.Vector3(0, 1, 0);
      bluePlate.angularSpeed = 0.02;
      yellowPlate.eulerPole = new THREE.Vector3(0, 1, 0);
      yellowPlate.angularSpeed = 0;
    }
  },
  'test1': {
    img: 'data/test1.png',
    init: function (plates) {
      const poles = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(0, 1, 1),
        new THREE.Vector3(0, 0, 1),
      ];
      poles.forEach(pole => pole.normalize());
      Object.values(plates).forEach((plate, i) => {
        plate.eulerPole = poles[i];
        plate.angularSpeed = 0.02;
      });
    }
  }
};
