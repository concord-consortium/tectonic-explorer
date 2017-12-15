import { scaleLinear } from 'd3-scale'
import { interpolateHcl } from 'd3-interpolate'
import { hsv } from 'd3-hsv'
import { rgb } from 'd3-color'

const MIN_ELEVATION = -1
const MAX_ELEVATION = 1

// Color object used internally by 3D rendering.
const toF = 1 / 255
function colorObj (rgb) {
  return {r: rgb.r * toF, g: rgb.g * toF, b: rgb.b * toF, a: rgb.opacity}
}

export function rgbToHex (rgb) {
  return Math.pow(2, 16) * Math.round(rgb.r * 255) + Math.pow(2, 8) * Math.round(rgb.g * 255) + Math.round(rgb.b * 255)
}

function d3ScaleToArray (d3Scale, shadesCount) {
  const result = []
  for (let i = 0; i < shadesCount; i += 1) {
    const c = rgb(d3Scale((i / shadesCount) * (MAX_ELEVATION - MIN_ELEVATION) + MIN_ELEVATION))
    result.push(colorObj(c))
  }
  return result
}

function d3Colormap (desc, shadesCount = null) {
  const keys = Object.keys(desc).map(k => Number(k)).sort()
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
  [MIN_ELEVATION]: '#2f85bf',
  0.00: '#3696d8',
  0.49: '#b5ebfe',
  0.50: '#A7DFD2',
  0.55: '#94BF8B',
  0.60: '#A8C68F',
  0.65: '#BDCC96',
  0.70: '#EFEBC0',
  0.75: '#DED6A3',
  0.80: '#AA8753',
  0.85: '#AC9A7C',
  0.90: '#CAC3B8',
  0.99: '#F5F4F2',
  [MAX_ELEVATION]: '#FFFFFF'
}, 1000)

export function topoColor (elevation) {
  const elevationNorm = (Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, elevation)) - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION)
  const shade = Math.floor(elevationNorm * (topoColormap.length - 1))
  return topoColormap[shade]
}

// Hue should be within [0, 360] range and elevation will be clamped to [-1, 1] range.
export function hueAndElevationToRgb (hue, elevation = 0) {
  const trenchVal = 0.3
  const deepestOceanVal = 0.4
  const highestMountainsVal = 1
  let value
  if (elevation < 0) {
    // Map elevation [-1, 0] to [trenchVal, deepestOceanVal]
    value = deepestOceanVal + Math.max(-1, elevation) * (deepestOceanVal - trenchVal)
  } else {
    // Map elevation [0, 1] to [deepestOceanVal, highestMountainsVal]
    value = deepestOceanVal + Math.min(1, elevation) * (highestMountainsVal - deepestOceanVal)
  }
  const rgb = hsv(hue, 1, value).rgb()
  return colorObj(rgb)
}
