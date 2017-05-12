import * as THREE from 'three';

// init function receives hash object with plates, where key is the plate's hue value on the input image.
export default {
  'two-plates': {
    img: 'data/two-plates.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
    }
  },
  'continent-collision': {
    img: 'data/continent-collision.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
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
      });
    }
  }
};
