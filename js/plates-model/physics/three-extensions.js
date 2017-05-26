import * as THREE from 'three'

THREE.Quaternion.prototype.multiplyScalar = function (scalar) {
  this.x *= scalar
  this.y *= scalar
  this.z *= scalar
  this.w *= scalar
  return this
}

THREE.Quaternion.prototype.add = function (quaternion) {
  this.x += quaternion.x
  this.y += quaternion.y
  this.z += quaternion.z
  this.w += quaternion.w
  return this
}
