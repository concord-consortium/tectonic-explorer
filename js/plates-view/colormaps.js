import { scaleLinear } from 'd3-scale';
import { interpolateHcl } from 'd3-interpolate';
import { rgb } from 'd3-color';

const toF = 1/255;
const transparent = {r: 0, g: 0, b: 0, a: 0};

function d3ScaleToArray(d3Scale, shadesCount) {
  const result = [];
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale(i / shadesCount));
    result.push({r: c.r * toF, g: c.g * toF, b: c.b * toF});
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

export function plateColor() {
  const colMap = plateColormap.default;
  return this.data.plateId !== undefined ? colMap[this.data.plateId % colMap.length] : transparent;
}
