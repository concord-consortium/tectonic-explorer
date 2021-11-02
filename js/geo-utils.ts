import * as THREE from "three";
import { IVector3 } from "./types";

// Converts [lat, lon] array to cartesian coordinates.
export function toCartesian(latLonArr: [number, number]) {
  const lat = latLonArr[0];
  const lon = latLonArr[1];
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon), // x
    Math.sin(lat), // y
    Math.cos(lat) * Math.sin(lon) // z
  );
}

export function toSpherical(vec3: IVector3) {
  // Make sure vec3.y is between [-1, 1]. Sometimes it might not be due to numerical errors.
  return { lat: Math.asin(Math.min(1, Math.max(-1, vec3.y))), lon: Math.atan2(vec3.z, vec3.x) };
}

// Converts [lat, lon] into a vector pointing north, assuming that the north direction is defined by [0, 1, 0] vector.
export function trueNorthVector(lat: number, lon: number) {
  return new THREE.Vector3(-Math.sin(lat) * Math.cos(lon), Math.cos(lat), -Math.sin(lat) * Math.sin(lon));
}
