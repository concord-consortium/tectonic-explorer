import * as THREE from 'three'
import grid from './grid'

function sortByDist (a, b) {
  return a.dist - b.dist
}

// Common functionality used by Plate and PlateProxy.
// Subclass should provide following properties:
// this.quaternion = new THREE.Quaternion()
// this.angularVelocity = new THREE.Vector3()
// this.fields = new Map()
export default class PlateBase {
  get angularSpeed () {
    return this.angularVelocity.length()
  }

  // Euler pole.
  get axisOfRotation () {
    if (this.angularSpeed === 0) {
      // Return anything, plate is not moving anyway.
      return new THREE.Vector3(1, 0, 0)
    }
    return this.angularVelocity.clone().normalize()
  }

  get size () {
    return this.fields.size
  }

  linearVelocity (absolutePos) {
    return this.angularVelocity.clone().cross(absolutePos)
  }

  // Returns absolute position of a field in cartesian coordinates (it applies plate rotation).
  absolutePosition (localPos) {
    return localPos.clone().applyQuaternion(this.quaternion)
  }

  // Returns local position.
  localPosition (absolutePos) {
    return absolutePos.clone().applyQuaternion(this.quaternion.clone().conjugate())
  }

  forEachField (callback) {
    this.fields.forEach(callback)
  }

  fieldAtAbsolutePos (absolutePos) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = grid.nearestFieldId(this.localPosition(absolutePos))
    return this.fields.get(fieldId)
  }

  // Returns N nearest fields, sorted by distance from absolutePos.
  // Note that number of returned fields might be smaller than `count` argument if there's no crust at given field.
  nearestFields (absolutePos, count) {
    const data = grid.nearestFields(this.localPosition(absolutePos), count)
    return data.map(arr => {
      return { field: this.fields.get(arr[0].id), dist: arr[1] }
    }).filter(entry => {
      return !!entry.field
    }).sort(sortByDist)
  }
}
