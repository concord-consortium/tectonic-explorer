import grid from './grid'
import config from '../config'
import { hsvToRgb, topoColor } from '../colormaps'

const TRANSPARENT = {r: 0, g: 0, b: 0, a: 0}
const COLLISION_COLOR = {r: 1, g: 1, b: 0.1, a: 1}
const SUBDUCTION_COLOR = {r: 0.2, g: 0.2, b: 0.5, a: 1}
const BOUNDARY_COLOR = {r: 0.8, g: 0.2, b: 0.5, a: 1}

function equalColors (c1, c2) {
  return c1 && c2 && c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a
}

export default class PlateRenderingHelper {
  constructor (plate) {
    this.plate = plate
    this.currentColor = {}
  }

  fieldColor (field, input) {
    if (input.renderBoundaries && field.border) {
      return BOUNDARY_COLOR
    }
    if (config.renderCollisions) {
      if (field.subduction) return SUBDUCTION_COLOR
      if (field.collision) return COLLISION_COLOR
    }
    if (input.colormap === 'topo') {
      return topoColor(field.elevation)
    } else if (input.colormap === 'plate') {
      return hsvToRgb(this.plate.baseColor, field.elevation)
    }
  }

  calculatePlateColors (input) {
    const colors = new Float32Array(grid.verticesCount * 4)
    const bumpScale = new Float32Array(grid.verticesCount)
    const nPolys = grid.fields.length
    for (let f = 0; f < nPolys; f += 1) {
      const field = this.plate.fields.get(f)
      const sides = grid.neighboursCount(f)
      let color = field ? this.fieldColor(field, input) : TRANSPARENT
      if (config.renderAdjacentFields && !field && this.plate.adjacentFields.has(f)) {
        color = this.adjacentFieldColor
      }
      // Optimization won't work when we create new array all the time.
      // if (equalColors(color, this.currentColor[f])) {
      //   continue
      // } else {
      //   this.currentColor[f] = color
      // }
      const c = grid.getFirstVertex(f)
      for (let s = 0; s < sides; s += 1) {
        let cc = (c + s)
        colors[cc * 4] = color.r
        colors[cc * 4 + 1] = color.g
        colors[cc * 4 + 2] = color.b
        colors[cc * 4 + 3] = color.a

        bumpScale[cc] = field && Math.max(0, field.elevation - 0.6)
      }
    }
    return {
      colors,
      bumpScale
    }
  }
}
