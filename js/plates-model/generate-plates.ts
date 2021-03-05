import { hsv } from "d3-hsv";
import Sphere from "../peels/sphere";
import config from "../config";
import Plate from "./plate";
import { elevationToCrustThickness, MAX_AGE, BASE_OCEAN_ELEVATION, HIGHEST_MOUNTAIN_ELEVATION } from "./field";

type HSV = { h: number; s: number; v: number; };

const ELEVATION_RANGE = HIGHEST_MOUNTAIN_ELEVATION - BASE_OCEAN_ELEVATION;

// Remember to update presets section in README if anything here is changed.
export const BASE_OCEAN_HSV_V = 0.4;
function getElevation(col: HSV) {
  // Map [0.4, 1.0] range to [BASE_OCEAN_ELEVATION, HIGHEST_MOUNTAIN_ELEVATION].
  return ((col.v - BASE_OCEAN_HSV_V) / (1 - BASE_OCEAN_HSV_V)) * ELEVATION_RANGE + BASE_OCEAN_ELEVATION;
}

function getType(elevation: number) {
  return elevation > BASE_OCEAN_ELEVATION + HIGHEST_MOUNTAIN_ELEVATION * 0.05 ? "continent" : "ocean";
}

export default function generatePlates(imgData: ImageData, initFunction?: ((plates: Record<number, Plate>) => void) | null) {
  const plates: Record<string, Plate> = {};
  const sphere = new Sphere({ divisions: config.divisions });
  sphere.fromRaster(imgData.data, imgData.width, imgData.height, 4, function(r: number, g: number, b: number) {
    // `this` is an instance of peels.Field.
    const fieldId = this.id;
    // Plate is defined by 'hue' component of the color.
    // 'value' component will define elevation in the future.
    const color = hsv(`rgb(${r},${g},${b})`);
    const key = Math.round(color.h / 10) * 10; // round hue value to 10, 20, 30, ..., 250 values.
    const elevation = getElevation(color);
    const type = getType(elevation);
    if (plates[key] === undefined) {
      plates[key] = new Plate({ hue: color.h, density: Object.keys(plates).length });
    }
    plates[key].addField({ id: fieldId, age: MAX_AGE, type, crustThickness: elevationToCrustThickness(elevation) });
  });
  Object.keys(plates).map(key => plates[key]).forEach(plate => {
    plate.updateInertiaTensor();
    plate.updateCenter();
  });
  // User-provided function that can modify default options of all the plates.
  if (initFunction) {
    initFunction(plates);
  }
  return Object.keys(plates).map((key: string) => plates[key]);
}
