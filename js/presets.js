import * as THREE from 'three';

// init function receives hash object with plates, where key is the plate's hue value on the input image.
export default {
  'subduction': {
    img: 'data/subduction.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
    }
  },
  'continentalCollision1': {
    img: 'data/continentalCollision1.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
      yellowPlate.addTorque(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0));
    }
  },
  'continentalCollision2': {
    img: 'data/continentalCollision2.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
      yellowPlate.addTorque(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
    }
  },
  'continentalCollision3': {
    img: 'data/continentalCollision3.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0.2, 0, 0));
      yellowPlate.addTorque(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0));
    }
  },
  'continentalCollision4': {
    img: 'data/continentalCollision4.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0.7, 0.7, 0));
    }
  },
  'continentOceanCollision': {
    img: 'data/continentOceanCollision.png',
    init: function (plates) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.addTorque(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
      yellowPlate.addTorque(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
    }
  },
  'test1': {
    img: 'data/test1.png',
    init: function (plates) {
      const torques = [
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(1, 1, 0), new THREE.Vector3(-0.3, 0.3, 0),
        new THREE.Vector3(1, 1, 1), new THREE.Vector3(0.3, -0.3, 0),
        new THREE.Vector3(0, 1, 1), new THREE.Vector3(0, 0.3, -0.3),
        new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.2, 0),
      ];
      Object.values(plates).forEach((plate, i) => {
        plate.addTorque(torques[i * 2].normalize(), torques[i * 2 + 1]);
      });
    }
  }
};
