import * as THREE from "three";
import config from "./config";
import Plate from "./plates-model/plate";

interface IPreset {
  img: string;
  icon?: string;
  init?: (plates: Record<string, Plate>) => void;
}

// init function receives hash object with plates, where key is the plate's hue value on the input image.
// Note that often init function will use plate names that refer to colors. These are colors in the input data image,
// not in the rendered model (it uses different colors, based on plate ID, defined in `plateHues` constant).
const presets: Record<string, IPreset> = {
  "subduction": {
    img: "data/subduction.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "divergentBoundary": {
    img: "data/divergentBoundary.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-config.userForce, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-config.userForce, 0, 0));
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
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const bluePlate = plates[240]; // 240 hue
      bluePlate.density = 0;
      greenPlate.density = 1;
      pinkPlate.density = 2;
      greenPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-config.userForce, 0, 0));
      pinkPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-config.userForce, 0, 0));
    }
  },
  "continentalCollision1": {
    img: "data/continentalCollision1v2.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "continentalCollision2": {
    img: "data/continentalCollision2.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "continentalCollision3": {
    img: "data/continentalCollision3.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      const purplePlate = plates[300]; // 300 hue
      purplePlate.density = 2;
      bluePlate.density = 1;
      yellowPlate.density = 0;
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "continentalCollision4": {
    img: "data/continentalCollision4.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce * 0.7, config.userForce * 0.7, 0));
    }
  },
  "continentOceanCollision": {
    img: "data/continentOceanCollision.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "islandCollision": {
    img: "data/islandCollision.png",
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "earth": {
    img: "data/earth.png",
  },
  "test1": {
    img: "data/test1.png",
    init(plates: Record<string, Plate>) {
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
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "benchmark": {
    img: "data/benchmark.png",
    init(plates: Record<string, Plate>) {
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
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "plates2": {
    img: "data/plates2.png",
    icon: "data/2-plate-icon@3x.png",
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      pinkPlate.id = pinkPlate.density = 0;
      greenPlate.id = greenPlate.density = 1;
    }
  },
  "plates3": {
    img: "data/plates3.png",
    icon: "data/3-plate-icon@3x.png",
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const violetPlate = plates[260]; // 260 hue
      pinkPlate.id = pinkPlate.density = 0;
      greenPlate.id = greenPlate.density = 1;
      violetPlate.id = violetPlate.density = 2;
    }
  },
  "plates4": {
    img: "data/plates4.png",
    icon: "data/4-plate-icon@3x.png",
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const violetPlate = plates[260]; // 260 hue
      const brownPlate = plates[30]; // 30 hue
      pinkPlate.id = pinkPlate.density = 0;
      violetPlate.id = violetPlate.density = 1;
      brownPlate.id = brownPlate.density = 2;
      greenPlate.id = greenPlate.density = 3;
    }
  },
  "plates5": {
    img: "data/plates5.png",
    icon: "data/5-plate-icon@3x.png",
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const violetPlate = plates[260]; // 260 hue
      const bluePlate = plates[200]; // 200 hue
      const brownPlate = plates[30]; // 30 hue
      pinkPlate.id = pinkPlate.density = 0;
      violetPlate.id = violetPlate.density = 1;
      brownPlate.id = brownPlate.density = 2;
      bluePlate.id = bluePlate.density = 3;
      greenPlate.id = greenPlate.density = 4;
    }
  },
  "plates5Uneven": {
    img: "data/plates5Uneven.png",
    icon: "data/5-plate-uneven-distribution-icon@3x.png",
    init(plates: Record<string, Plate>) {
      const brownPlate = plates[30]; // 30 hue
      const pinkPlate = plates[300]; // 300 hue
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      const greenPlate = plates[160]; // 160 hue
      brownPlate.id = brownPlate.density = 0;
      pinkPlate.id = pinkPlate.density = 1;
      bluePlate.id = bluePlate.density = 2;
      yellowPlate.id = yellowPlate.density = 3;
      greenPlate.id = greenPlate.density = 4;
    }
  }
};

export default presets;
