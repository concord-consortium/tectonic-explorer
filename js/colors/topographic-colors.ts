import { scaleLinear } from "d3-scale";
import { interpolateHcl } from "d3-interpolate";
import { hsv } from "d3-hsv";
import { rgb } from "d3-color";
import { HIGHEST_MOUNTAIN_ELEVATION, BASE_OCEAN_ELEVATION } from "../plates-model/field";
import { BASE_OCEAN_HSV_V } from "../plates-model/generate-plates";
import { RGBAFloat, d3RGBToRGBAFloat } from "./utils";

export const MIN_ELEVATION = -1;
export const MAX_ELEVATION = HIGHEST_MOUNTAIN_ELEVATION;

function d3ScaleToArray(d3Scale: any, shadesCount: number): RGBAFloat[] {
  const result = [];
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale((i / shadesCount) * (MAX_ELEVATION - MIN_ELEVATION) + MIN_ELEVATION));
    result.push(d3RGBToRGBAFloat(c));
  }
  return result;
}

function d3Colormap(desc: any, shadesCount: number | null = null): RGBAFloat[] {
  const keys = Object.keys(desc).map(k => Number(k)).sort((a, b) => a - b);
  if (!shadesCount) {
    shadesCount = keys.length;
  }
  const colors = keys.map(k => desc[k]);
  const d3Scale = scaleLinear()
    .domain(keys)
    .range(colors)
    .interpolate(interpolateHcl as any);
  return d3ScaleToArray(d3Scale, shadesCount);
}

// https://gist.github.com/hugolpz/4351d8f1b3da93de2c61
// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Maps/Conventions#Topographic_maps
const topoColormap = d3Colormap({
  [MIN_ELEVATION]: "#0b161e",
  [-0.4]: "#143248", // this defines trench color, as it has negative elevation (but still pretty close to 0)
  [BASE_OCEAN_ELEVATION]: "#3696d8",
  0.49: "#b5ebfe",
  0.50: "#A7DFD2",
  0.55: "#94BF8B",
  0.60: "#A8C68F",
  0.65: "#BDCC96",
  0.70: "#EFEBC0",
  0.75: "#DED6A3",
  0.80: "#AA8753",
  0.85: "#AC9A7C",
  0.90: "#CAC3B8",
  0.99: "#F5F4F2",
  [MAX_ELEVATION]: "#FFFFFF"
}, 1000);

export function normalizeElevation(elevation: number) {
  return (elevation - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION);
}

export function topoColor(elevation: number) {
  return topoColormap[Math.floor(normalizeElevation(elevation) * (topoColormap.length - 1))];
}

// Hue should be within [0, 360] range and elevation will be clamped to [-1, 1] range.
export function hueAndElevationToRgb(hue: number, elevation = 0) {
  const trenchVal = BASE_OCEAN_HSV_V - 0.1; // anything below BASE_OCEAN_HSV_V
  const deepestOceanVal = BASE_OCEAN_HSV_V;
  const highestMountainsVal = HIGHEST_MOUNTAIN_ELEVATION;
  let value;
  if (elevation < 0) {
    // Map elevation [-1, 0] to [trenchVal, deepestOceanVal]
    value = deepestOceanVal + Math.max(-1, elevation) * (deepestOceanVal - trenchVal);
  } else {
    // Map elevation [0, 1] to [deepestOceanVal, highestMountainsVal]
    value = deepestOceanVal + Math.min(1, elevation) * (highestMountainsVal - deepestOceanVal);
  }
  const rgbVal = hsv(hue, 1, value).rgb();
  return d3RGBToRGBAFloat(rgbVal);
}
