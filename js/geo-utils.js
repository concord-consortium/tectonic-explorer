import * as THREE from 'three';

// Converts [lat, lon] array to cartesian coordinates.
export function toCartesian(latLonArr) {
  const lat = latLonArr[0];
  const lon = latLonArr[1];
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon), // x
    Math.sin(lat), // y
    Math.cos(lat) * Math.sin(lon) // z
  );
}

export function toSpherical(vec3) {
  // Make sure vec3.y is between [-1, 1]. Sometimes it might not be due to numerical errors.
  return {lat: Math.asin(Math.min(1, Math.max(-1, vec3.y))), lon: Math.atan2(vec3.z, vec3.x)};
}
