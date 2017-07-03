import { scaleLinear } from 'd3-scale'
import { interpolateHcl } from 'd3-interpolate'
import { hsv } from 'd3-hsv'
import { rgb } from 'd3-color'

// Color object used internally by 3D rendering.
const toF = 1 / 255
export function colorObj (rgb) {
  return {r: rgb.r * toF, g: rgb.g * toF, b: rgb.b * toF, a: rgb.opacity}
}

const BASE_HSV_VALUE = 0.2
export function hsvToRgb (col, val = 0) {
  // So: for val = 0, we'll use v = BASE_HSV_VALUE, for val = 1, we'll use v = 1.
  const rgb = hsv(col.h, col.s, BASE_HSV_VALUE + val * (1 - BASE_HSV_VALUE)).rgb()
  return colorObj(rgb)
}

export function rgbToHex (rgb) {
  return Math.pow(2, 16) * Math.round(rgb.r * 255) + Math.pow(2, 8) * Math.round(rgb.g * 255) + Math.round(rgb.b * 255)
}

function d3ScaleToArray (d3Scale, shadesCount) {
  const result = []
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale(i / shadesCount))
    result.push(colorObj(c))
  }
  return result
}

function d3Colormap (desc, shadesCount = null) {
  const keys = Object.keys(desc).sort()
  if (!shadesCount) shadesCount = keys.length
  const colors = keys.map(k => desc[k])
  const d3Scale = scaleLinear()
    .domain(keys)
    .range(colors)
    .interpolate(interpolateHcl)
  return d3ScaleToArray(d3Scale, shadesCount)
}

// https://gist.github.com/hugolpz/4351d8f1b3da93de2c61
// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Maps/Conventions#Topographic_maps
const topoColormap = d3Colormap({
  0.00: '#004e83',
  0.20: '#3696d8',
  0.49: '#b5ebfe',
  0.50: '#ACD0A5',
  0.55: '#94BF8B',
  0.60: '#A8C68F',
  0.65: '#BDCC96',
  0.70: '#EFEBC0',
  0.75: '#DED6A3',
  0.80: '#AA8753',
  0.85: '#AC9A7C',
  0.90: '#CAC3B8',
  0.99: '#F5F4F2',
  1.00: '#FFFFFF'
}, 1000)

export function topoColor (elevation) {
  // Elevation is expected to be within [0, 1] range.
  elevation = Math.max(0, Math.min(1, elevation))
  const shade = Math.floor(elevation * (topoColormap.length - 1))
  return topoColormap[shade]
}
