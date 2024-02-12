import * as THREE from "three";
import config from "./config";
import Plate from "./plates-model/plate";
import subductionImg from "./data/subduction.png";
import divergentBoundaryImg from "./data/divergentBoundary.png";
import divergentBoundary2Img from "./data/divergentBoundary2.png";
import plateDivision1Img from "./data/plateDivision1.png";
import plateDivision2Img from "./data/plateDivision2.png";
import transformBoundaryImg from "./data/transformBoundary.png";
import continentalCollision1v2Img from "./data/continentalCollision1v2.png";
import continentalCollision2Img from "./data/continentalCollision2.png";
import continentalCollision3Img from "./data/continentalCollision3.png";
import continentalCollision4Img from "./data/continentalCollision4.png";
import continentOceanCollisionImg from "./data/continentOceanCollision.png";
import islandCollisionImg from "./data/islandCollision.png";
import plateMergeImg from "./data/plateMerge.png";
import earthImg from "./data/earth.png";
import test1Img from "./data/test1.png";
import benchmarkImg from "./data/benchmark.png";
import plates2Img from "./data/plates2.png";
import plates3Img from "./data/plates3.png";
import plates4Img from "./data/plates4.png";
import plates5Img from "./data/plates5.png";
import plates5UnevenImg from "./data/plates5Uneven.png";
import plate2Icon from "./data/2-plate-icon@3x.png";
import plate3Icon from "./data/3-plate-icon@3x.png";
import plate4Icon from "./data/4-plate-icon@3x.png";
import plate5Icon from "./data/5-plate-icon@3x.png";
import plate5UnevenDistributionIcon from "./data/5-plate-uneven-distribution-icon@3x.png";

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
    img: subductionImg,
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "divergentBoundary": {
    img: divergentBoundaryImg,
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-config.userForce, 0, 0));
      yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-config.userForce, 0, 0));
    }
  },
  "divergentBoundary2": {
    img: divergentBoundary2Img,
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
    img: plateDivision1Img
  },
  "plateDivision2": {
    img: plateDivision2Img
  },
  "transformBoundary": {
    img: transformBoundaryImg,
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
    img: continentalCollision1v2Img,
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
    img: continentalCollision2Img,
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
    img: continentalCollision3Img,
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
    img: continentalCollision4Img,
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce * 0.7, config.userForce * 0.7, 0));
    }
  },
  "continentOceanCollision": {
    img: continentOceanCollisionImg,
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
    img: islandCollisionImg,
    init(plates: Record<string, Plate>) {
      const bluePlate = plates[210]; // 210 hue
      const yellowPlate = plates[70]; // 70 hue
      bluePlate.density = 1;
      yellowPlate.density = 0;
      bluePlate.setHotSpot(new THREE.Vector3(0, 0, 1), new THREE.Vector3(config.userForce, 0, 0));
    }
  },
  "plateMerge": {
    img: plateMergeImg,
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      const violetPlate = plates[260]; // 260 hue
      pinkPlate.density = 1;
      greenPlate.density = 0;
      violetPlate.density = 2;

      pinkPlate.setHotSpot(new THREE.Vector3(0.7, 0.7, 0), new THREE.Vector3(0, 0, -config.userForce));
      greenPlate.setHotSpot(new THREE.Vector3(0.7, 0.7, 0), new THREE.Vector3(0, 0, config.userForce));

      violetPlate.setHotSpot(new THREE.Vector3(1, -0.1, -1), new THREE.Vector3(0, 3 * config.userForce, 0));
    }
  },
  "earth": {
    img: earthImg,
  },
  "test1": {
    img: test1Img,
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
    img: benchmarkImg,
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
    img: plates2Img,
    icon: plate2Icon,
    init(plates: Record<string, Plate>) {
      const pinkPlate = plates[320]; // 320 hue
      const greenPlate = plates[130]; // 130 hue
      pinkPlate.id = pinkPlate.density = 0;
      greenPlate.id = greenPlate.density = 1;
    }
  },
  "plates3": {
    img: plates3Img,
    icon: plate3Icon,
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
    img: plates4Img,
    icon: plate4Icon,
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
    img: plates5Img,
    icon: plate5Icon,
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
    img: plates5UnevenImg,
    icon: plate5UnevenDistributionIcon,
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
