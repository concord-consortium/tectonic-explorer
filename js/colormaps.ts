import { scaleLinear } from "d3-scale";
import { interpolateHcl } from "d3-interpolate";
import { hsv } from "d3-hsv";
import { rgb } from "d3-color";
import { HIGHEST_MOUNTAIN_ELEVATION, BASE_OCEAN_ELEVATION } from "./plates-model/field";
import { BASE_OCEAN_HSV_V } from "./plates-model/generate-plates";
import { Rock } from "./plates-model/crust";

export const MIN_ELEVATION = -1;
export const MAX_ELEVATION = HIGHEST_MOUNTAIN_ELEVATION;

export type RGBA = { r: number; g: number; b: number; a: number; };

// Color object used internally by 3D rendering.
const toF = 1 / 255;
function colorObj(rgbVal: any): RGBA {
  return { r: rgbVal.r * toF, g: rgbVal.g * toF, b: rgbVal.b * toF, a: rgbVal.opacity };
}

export function rgbToHex(rgbVal: any) {
  return Math.pow(2, 16) * Math.round(rgbVal.r * 255) + Math.pow(2, 8) * Math.round(rgbVal.g * 255) + Math.round(rgbVal.b * 255);
}

function d3ScaleToArray(d3Scale: any, shadesCount: any) {
  const result = [];
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale((i / shadesCount) * (MAX_ELEVATION - MIN_ELEVATION) + MIN_ELEVATION));
    result.push(colorObj(c));
  }
  return result;
}

function d3Colormap(desc: any, shadesCount: number | null = null) {
  const keys = Object.keys(desc).map(k => Number(k)).sort();
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
  [MIN_ELEVATION]: "#15364d",
  [-0.05]: "#173e5c",
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
  return (Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, elevation)) - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION);
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
  return colorObj(rgbVal);
}

export const ROCKS_COL: Record<Rock, string> = {
  [Rock.Granite]: "#4b1e01",
  [Rock.Basalt]: "#06151b",
  [Rock.Gabbro]: "#5d5243",
  [Rock.AndesiticRocks]: "#585c5d",
  [Rock.MaficRocks]: "#373633",
  [Rock.Sediment]: "#a87d05",
};

export const ROCKS_COL_RGBA: Record<Rock, RGBA> = (() => {
  const result: Partial<Record<Rock, RGBA>> = {};
  Object.keys(ROCKS_COL).forEach((key: string) => {
    const rock = Number(key) as Rock;
    result[rock] = colorObj(rgb(ROCKS_COL[rock]));
  });
  return result as Record<Rock, RGBA>;
})();

export function rockColor(rockType: Rock) {
  return ROCKS_COL[rockType];
}

export function rockColorRGBA(rockType: Rock) {
  return ROCKS_COL_RGBA[rockType];
}
