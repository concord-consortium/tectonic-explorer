import * as THREE from "three";
(THREE.Quaternion.prototype as any).multiplyScalar = function (scalar: any) {
  this.x *= scalar;
  this.y *= scalar;
  this.z *= scalar;
  this.w *= scalar;
  return this;
};
(THREE.Quaternion.prototype as any).add = function (quaternion: any) {
  this.x += quaternion.x;
  this.y += quaternion.y;
  this.z += quaternion.z;
  this.w += quaternion.w;
  return this;
};
