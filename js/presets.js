import * as THREE from 'three';

// init function receives hash object with plates, where key is the plate's hue value on the input image.
export default {
  'two-plates': {
    img: 'data/two-plates.png',
    init: function(plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[65]; // 65 hue
      bluePlate.eulerPole = new THREE.Vector3(0, 1, 0);
      bluePlate.angularSpeed = 0.015;
      yellowPlate.eulerPole = new THREE.Vector3(0, 1, 0);
      yellowPlate.angularSpeed = -0.01;
    }
  },
  'test1': {
    img: 'data/test1.png'
  }
};
