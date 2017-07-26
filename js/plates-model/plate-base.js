import * as THREE from 'three'

// Common functionality used by Plate and PlateProxy.
export default class PlateBase {
  constructor () {
    this.quaternion = new THREE.Quaternion()
    this.angularVelocity = new THREE.Vector3()
  }

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
}
