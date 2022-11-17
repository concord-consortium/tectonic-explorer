import * as THREE from "three";
import { IMatrix3Array } from "../types";
import Field from "./field";
import Plate from "./plate";

export interface ISerializedPlateGroup {
  plateIds: number[];
  mass: number;
  invMomentOfInertia: IMatrix3Array;
}

// Grouped plates behave like a single rigid plate from the physics calculations point of view.
// PlateGroup provide a new way to calculate moment of inertia and angular acceleration.
export default class PlateGroup {
  plates: Set<Plate>;
  // Physics properties:
  mass = 0;
  invMomentOfInertia = new THREE.Matrix3();

  constructor(plates?: Plate[]) {
    this.plates = new Set(plates);
    this.updateInertiaTensor();
  }

  serialize(): ISerializedPlateGroup {
    return {
      plateIds: Array.from(this.plates).map(plate => plate.id),
      mass: this.mass,
      invMomentOfInertia: this.invMomentOfInertia.toArray(),
    };
  }

  static deserialize(props: ISerializedPlateGroup, plates: Plate[]) {
    const plateGroup = new PlateGroup(plates);
    plateGroup.mass = props.mass;
    plateGroup.invMomentOfInertia = (new THREE.Matrix3()).fromArray(props.invMomentOfInertia);
    return plateGroup;
  }

  mergeGroup(anotherPlateGroup: PlateGroup) {
    anotherPlateGroup.plates.forEach(plate => {
      this.plates.add(plate);
    });
    this.updateInertiaTensor();
  }

  has(plate: Plate) {
    return this.plates.has(plate);
  }

  // It depends on current angular velocity and velocities of other, colliding plates.
  // Note that this is pretty expensive to calculate, so if used much, the current value should be cached.
  get totalTorque() {
    const totalTorque = new THREE.Vector3();
    this.plates.forEach(plate => {
      totalTorque.add(plate.totalTorque);
    });
    return totalTorque;
  }

  get angularAcceleration() {
    return this.totalTorque.applyMatrix3(this.invMomentOfInertia);
  }

  updateInertiaTensor() {
    this.mass = 0;
    let ixx = 0;
    let iyy = 0;
    let izz = 0;
    let ixy = 0;
    let ixz = 0;
    let iyz = 0;

    this.plates.forEach(plate => {
      plate.fields.forEach((field: Field) => {
        const mass = field.mass;
        const p = field.absolutePos;
        ixx += mass * (p.y * p.y + p.z * p.z);
        iyy += mass * (p.x * p.x + p.z * p.z);
        izz += mass * (p.x * p.x + p.y * p.y);
        ixy -= mass * p.x * p.y;
        ixz -= mass * p.x * p.z;
        iyz -= mass * p.y * p.z;
        this.mass += mass;
      });
    });

    const momentOfInertia = new THREE.Matrix3();
    momentOfInertia.set(ixx, ixy, ixz, ixy, iyy, iyz, ixz, iyz, izz);
    this.invMomentOfInertia = new THREE.Matrix3();
    this.invMomentOfInertia.copy(momentOfInertia).invert();
  }
}
