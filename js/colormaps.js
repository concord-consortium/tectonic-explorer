import { scaleLinear } from 'd3-scale';
import { interpolateHcl } from 'd3-interpolate';
import { rgb } from 'd3-color';

// Color object used internally by 3D rendering.
const toF = 1 / 255;
export function colorObj(rgb) {
  return {r: rgb.r * toF, g: rgb.g * toF, b: rgb.b * toF, a: rgb.opacity};
}

export function rgbToHex(rgb) {
  return Math.pow(2, 16) * Math.round(rgb.r * 255) + Math.pow(2, 8) * Math.round(rgb.g * 255) + Math.round(rgb.b * 255);
}

function d3ScaleToArray(d3Scale, shadesCount) {
  const result = [];
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale(i / shadesCount));
    result.push(colorObj(c));
  }
  return result;
}

function d3Colormap(desc, shadesCount = null) {
  const keys = Object.keys(desc).sort();
  if (!shadesCount) shadesCount = keys.length;
  const colors = keys.map(k => desc[k]);
  const d3Scale = scaleLinear()
    .domain(keys)
    .range(colors)
    .interpolate(interpolateHcl);
  return d3ScaleToArray(d3Scale, shadesCount);
}

const plateColormap = {
  // https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory20
  default: d3Colormap({
    0.0: '#1f77b4',
    0.1: '#2ca02c',
    0.2: '#ff9896',
    0.3: '#9467bd',
    0.4: '#8c564b',
    0.5: '#bcbd22',
    0.6: '#17becf',
    0.7: '#d6616b',
    0.8: '#dbdb8d',
    0.9: '#c7c7c7',
  }),
};

export function plateColor(id) {
  const colMap = plateColormap.default;
  return colMap[id % colMap.length];
}
