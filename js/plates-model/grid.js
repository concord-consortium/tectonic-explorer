import Sphere from '../peels/sphere'
import config from '../config'
import VoronoiSphere from './voronoi-sphere'
import { toCartesian } from '../geo-utils'
import { kdTree } from 'kd-tree-javascript'

// Overwrite constructor name, so standard-js doesn't print warnings...
const KdTree = kdTree

function dist (a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
}

const VORONOI_SPHERE_FIELDS_COUNT = 200000

class Grid {
  constructor () {
    this.sphere = new Sphere({divisions: config.divisions})
    this.processFields()
    this.fieldDiameter = this.calcFieldDiameter()
    // Note that kdTree will modify and reorder input array.
    this.kdTree = new KdTree(this.generateKDTreeNodes(), dist, ['x', 'y', 'z'])
    this.voronoiSphere = new VoronoiSphere(VORONOI_SPHERE_FIELDS_COUNT, this.kdTree)
  }

  get size () {
    return this.fields.length
  }

  get fields () {
    return this.sphere.fields
  }

  // Pre-calculate additional information.
  processFields () {
    this.fields.forEach(field => {
      field.localPos = toCartesian(field.position)
      field.adjacentFields = field._adjacentFields.map(f => f.id)
    })
  }

  calcFieldDiameter () {
    const field = this.fields[3]
    let distSum = 0
    field.adjacentFields.forEach(id => {
      const adjField = this.fields[id]
      distSum += field.localPos.distanceTo(adjField.localPos)
    })
    return distSum / field.adjacentFields.length
  }

  generateKDTreeNodes () {
    const fields = []
    this.fields.forEach(field => {
      const pos = field.localPos
      fields.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        id: field.id // index
      })
    })
    return fields
  }

  neighboursCount (fieldId) {
    return this.fields[fieldId].adjacentFields.length
  }

  // point is expected to have .x, .y, .z properties.
  nearestFieldId (point) {
    if (config.optimizedCollisions) {
      // O(1), less accurate:
      return this.voronoiSphere.getNearestId(point)
    }
    // O(logn), accurate:
    return this.kdTree.nearest(point, 1)[0][0].id
  }

  getGeometryAttributes () {
    const transparent = {r: 0, g: 0, b: 0, a: 0}
    let attributes
    // Actually it's fully synchronous function, but API is a bit overspoken.
    this.sphere.toCG({colorFn: () => transparent, type: 'poly-per-field'}, (_err, _attributes) => {
      attributes = _attributes
    })
    return attributes
  }
}

const grid = window.g = new Grid()
export default grid
