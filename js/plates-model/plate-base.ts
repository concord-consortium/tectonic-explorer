import * as THREE from "three";
import Field from "./field";
import getGrid from "./grid";

function sortByDist(a: any, b: any) {
  return a.dist - b.dist;
}

// Common functionality used by Plate and PlateStore.
// Subclass should provide following properties:
// this.quaternion = new THREE.Quaternion()
// this.angularVelocity = new THREE.Vector3()
// this.fields = new Map()
export default abstract class PlateBase {
  abstract angularVelocity: THREE.Vector3;
  abstract fields: Map<string, Field>;
  abstract quaternion: THREE.Quaternion;

  get angularSpeed() {
    return this.angularVelocity.length();
  }

  // Euler pole.
  get axisOfRotation() {
    if (this.angularSpeed === 0) {
      // Return anything, plate is not moving anyway.
      return new THREE.Vector3(1, 0, 0);
    }
    return this.angularVelocity.clone().normalize();
  }

  get size() {
    return this.fields.size;
  }

  linearVelocity(absolutePos: any) {
    return this.angularVelocity.clone().cross(absolutePos);
  }

  // Returns absolute position of a field in cartesian coordinates (it applies plate rotation).
  absolutePosition(localPos: any) {
    return localPos.clone().applyQuaternion(this.quaternion);
  }

  // Returns local position.
  localPosition(absolutePos: any) {
    return absolutePos.clone().applyQuaternion(this.quaternion.clone().conjugate());
  }

  forEachField(callback: any) {
    this.fields.forEach(callback);
  }

  fieldAtAbsolutePos(absolutePos: any) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = getGrid().nearestFieldId(this.localPosition(absolutePos));
    return this.fields.get(fieldId);
  }

  // Returns N nearest fields, sorted by distance from absolutePos.
  // Note that number of returned fields might be smaller than `count` argument if there's no crust at given field.
  nearestFields(absolutePos: any, count: any) {
    const data = getGrid().nearestFields(this.localPosition(absolutePos), count);
    return data.map((arr: any) => {
      return { field: this.fields.get(arr[0].id), dist: arr[1] };
    }).filter((entry: any) => {
      return !!entry.field;
    }).sort(sortByDist);
  }
}
