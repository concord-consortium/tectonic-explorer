import * as THREE from "three";
import { multiplyQuatByScalar, addQuaternions } from "./three-extensions";

// w = a * dt
export function updateAngularVelocity(velocity: THREE.Vector3, acceleration: THREE.Vector3, timestep: number) {
  return velocity.clone().add(acceleration.clone().multiplyScalar(timestep));
}

// This can be found in many resources related to angular motion (I've used "Physics for game developers")
// or e.g. in this 3D physics engine:
// https://github.com/RandyGaul/qu3e/blob/641cabe3cf7ef0c46690bad18d9e06b66810f83d/src/math/q3Quaternion.cpp#L86
// Main equation is:
// dq = 0.5 * q0 * w * dt
// q1 = q0 + dq
// where: q0 - initial rotation, w - quaternion based on angular velocity, q1 - final rotation
export function integrateRotationQuaternion(quaternion: THREE.Quaternion, velocity: THREE.Vector3, timestep: number) {
  const wQuat = new THREE.Quaternion(velocity.x * timestep, velocity.y * timestep, velocity.z * timestep, 0);
  const qDiff = multiplyQuatByScalar(wQuat.multiply(quaternion), 0.5);
  return addQuaternions(quaternion.clone(), qDiff).normalize();
}

export function getNewVelocities(model: any, velocity: any, acceleration: any, timestep: any) {
  const result = new Map();
  model.forEachPlate((p: any) => {
    result.set(p, updateAngularVelocity(velocity.get(p), acceleration.get(p), timestep));
  });
  return result;
}

export function getNewQuaternions(model: any, quaternion: any, velocity: any, timestep: any) {
  const result = new Map();
  model.forEachPlate((p: any) => {
    result.set(p, integrateRotationQuaternion(quaternion.get(p), velocity.get(p), timestep));
  });
  return result;
}
