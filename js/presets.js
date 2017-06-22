import * as THREE from 'three'

// init function receives hash object with plates, where key is the plate's hue value on the input image.
export default {
  'subduction': {
    img: 'data/subduction.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      // const yellowPlate = plates[70] // 70 hue
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2.5, 0, 0))
    }
  },
  'continentalCollision1': {
    img: 'data/continentalCollision1.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      const yellowPlate = plates[70] // 70 hue
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0))
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0))
    }
  },
  'continentalCollision2': {
    img: 'data/continentalCollision2.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      const yellowPlate = plates[70] // 70 hue
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0))
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0))
    }
  },
  'continentalCollision3': {
    img: 'data/continentalCollision3.png',
    init: function (plates) {
      // const bluePlate = plates[210] // 210 hue
      const yellowPlate = plates[70] // 70 hue
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0))
    }
  },
  'continentalCollision4': {
    img: 'data/continentalCollision4.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      // const yellowPlate = plates[70] // 70 hue
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 2, 0))
    }
  },
  'continentOceanCollision': {
    img: 'data/continentOceanCollision.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      const yellowPlate = plates[70] // 70 hue
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(3, 0, 0))
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(3, 0, 0))
    }
  },
  'test1': {
    img: 'data/test1.png',
    init: function (plates) {
      const bluePlate = plates[210] // 210 hue
      const pinkPlate = plates[320] // 320 hue
      const yellowPlate = plates[70] // 70 hue
      const violetPlate = plates[260] // 260 hue
      const greenPlate = plates[130] // 130 hue
      bluePlate.density = 0
      violetPlate.density = 1
      yellowPlate.density = 2
      greenPlate.density = 3
      pinkPlate.density = 4
    }
  }
}
