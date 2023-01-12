import * as THREE from "three";

export const multiplyQuatByScalar = (quaternion: THREE.Quaternion, scalar: number) => {
  quaternion.x *= scalar;
  quaternion.y *= scalar;
  quaternion.z *= scalar;
  quaternion.w *= scalar;
  return quaternion;
};

export const addQuaternions = (quaternion1: THREE.Quaternion, quaternion2: THREE.Quaternion) => {
  quaternion1.x += quaternion2.x;
  quaternion1.y += quaternion2.y;
  quaternion1.z += quaternion2.z;
  quaternion1.w += quaternion2.w;
  return quaternion1;
};
