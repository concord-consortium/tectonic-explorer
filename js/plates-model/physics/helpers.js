import * as THREE from 'three';
import './three-extensions'; // new quaternion operations

// Physics:

// w = a * dt
export function updateAngularVelocity(velocity, acceleration, timestep) {
  return velocity.clone().add(acceleration.clone().multiplyScalar(timestep));
}

// This can be found in many resources related to angular motion (I've used "Physics for game developers")
// or e.g. in this 3D physics engine:
// https://github.com/RandyGaul/qu3e/blob/641cabe3cf7ef0c46690bad18d9e06b66810f83d/src/math/q3Quaternion.cpp#L86
// Main equation is:
// dq = 0.5 * q0 * w * dt
// q1 = q0 + dq
// where: q0 - initial rotation, w - quaternion based on angular velocity, q1 - final rotation
export function integrateRotationQuaternion(quaternion, velocity, timestep) {
  const wQuat = new THREE.Quaternion(velocity.x * timestep, velocity.y * timestep, velocity.z * timestep, 0);
  const qDiff = wQuat.multiply(quaternion).multiplyScalar(0.5);
  return quaternion.clone().add(qDiff).normalize();
}

// Other helpers:

// Returns map of given properties.
export function get(model, property) {
  const result = new Map();
  model.forEachPlate(plate => {
    if (property === 'acceleration') {
      result.set(plate, plate.calcAngularAcceleration());
    } else {
      result.set(plate, plate[property].clone());
    }
  });
  return result;
}

// Updates each plate.
export function set(model, map, propName) {
  model.forEachPlate(plate => {
    plate[propName] = map.get(plate);
  });
}

export function getNewVelocities(model, velocity, acceleration, timestep) {
  const result = new Map();
  model.forEachPlate(p => {
    result.set(p, updateAngularVelocity(velocity.get(p), acceleration.get(p), timestep));
  });
  return result;
}

export function getNewQuaternions(model, quaternion, velocity, timestep) {
  const result = new Map();
  model.forEachPlate(p => {
    result.set(p, integrateRotationQuaternion(quaternion.get(p), velocity.get(p), timestep));
  });
  return result;
}
