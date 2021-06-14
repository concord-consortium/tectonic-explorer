import * as THREE from "three";

interface IPreset {
  img: string;
  init?: (plates: any) => void;
}

// init function receives hash object with plates, where key is the plate's hue value on the input image.
const presets: Record<string, IPreset> = {
  "subduction": {
    img: "data/subduction.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2.5, 0, 0));
    }
  },
  "divergentBoundary": {
    img: "data/divergentBoundary.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1.5, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1.5, 0, 0));
    }
  },
  "plateDivision1": {
    img: "data/plateDivision1.png"
  },
  "plateDivision2": {
    img: "data/plateDivision2.png"
  },
  "transformBoundary": {
    img: "data/transformBoundary.png",
    init(plates: any) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const bluePlate = plates[240]; // 240 hue
      bluePlate.density = 0;
      greenPlate.density = 1;
      pinkPlate.density = 2;
      greenPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1.5, 0, 0));
      pinkPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1.5, 0, 0));
    }
  },
  "continentalCollision1": {
    img: "data/continentalCollision1.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0));
    }
  },
  "continentalCollision2": {
    img: "data/continentalCollision2.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(2, 0, 0));
    }
  },
  "continentalCollision3": {
    img: "data/continentalCollision3.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      const purplePlate = plates[300]; // 300 hue
      purplePlate.density = 2;
      bluePlate.density = 1;
      yellowPlate.density = 0;
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
    }
  },
  "continentalCollision4": {
    img: "data/continentalCollision4.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 2, 0));
    }
  },
  "continentOceanCollision": {
    img: "data/continentOceanCollision.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(3, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(3, 0, 0));
    }
  },
  "islandCollision": {
    img: "data/islandCollision.png",
    init(plates: any) {
      const yellowPlate = plates[70]; // 70 hue
      const bluePlate = plates[210]; // 210 hue
      const violetPlate = plates[300]; // 300 hue
      yellowPlate.density = 1;
      bluePlate.density = 2;
      violetPlate.density = 3;
      violetPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(4, 0, 0));
    }
  },
  "islandCollision2": {
    img: "data/islandCollision2.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2.5, 0, 0));
    }
  },
  "subductionIssue1": {
    img: "data/subductionIssue1.png",
    init(plates: any) {
      const greenPlate = plates[160]; // 160 hue
      const yellowPlate = plates[70]; // 70 hue
      const pinkPlate = plates[320]; // 320 hue
      greenPlate.density = 2;
      pinkPlate.density = 1;
      yellowPlate.density = 0;
      pinkPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-4, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
    }
  },
  "earth": {
    img: "data/earth.png",
  },
  "test1": {
    img: "data/test1.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const pinkPlate = plates[320]; // 320 hue
      const yellowPlate = plates[70]; // 70 hue
      const violetPlate = plates[260]; // 260 hue
      const greenPlate = plates[130]; // 130 hue
      bluePlate.density = 4;
      violetPlate.density = 3;
      yellowPlate.density = 2;
      greenPlate.density = 1;
      pinkPlate.density = 0;
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(3, 0, 0));
    }
  },
  "benchmark": {
    img: "data/benchmark.png",
    init(plates: any) {
      const bluePlate = plates[210]; // 210 hue
      const pinkPlate = plates[320]; // 320 hue
      const yellowPlate = plates[70]; // 70 hue
      const violetPlate = plates[260]; // 260 hue
      const greenPlate = plates[130]; // 130 hue
      bluePlate.density = 4;
      violetPlate.density = 3;
      yellowPlate.density = 2;
      greenPlate.density = 1;
      pinkPlate.density = 0;
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(2, 0, 0));
    }
  },
  "circles": {
    img: "data/circles.png"
  },
  "plates2": {
    img: "data/plates2.png"
  },
  "plates3": {
    img: "data/plates3.png"
  },
  "plates4": {
    img: "data/plates4.png"
  },
  "plates5": {
    img: "data/plates5.png"
  },
  "plates5Uneven": {
    img: "data/plates5Uneven.png"
  }
};

export default presets;
