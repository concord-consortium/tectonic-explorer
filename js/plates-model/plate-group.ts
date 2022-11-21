import * as THREE from "three";
import { IMatrix3Array } from "../types";
import Plate from "./plate";

export interface ISerializedPlateGroup {
  plateIds: number[];
  mass: number;
  momentOfInertia: IMatrix3Array;
  invMomentOfInertia: IMatrix3Array;
}

// Grouped plates behave like a single rigid plate from the physics calculations point of view.
// PlateGroup provide a new way to calculate moment of inertia and angular acceleration.
export default class PlateGroup {
  plates: Set<Plate>;
  // Physics properties:
  mass = 0;
  momentOfInertia = new THREE.Matrix3();
  invMomentOfInertia = new THREE.Matrix3();

  constructor(plates?: Plate[]) {
    this.plates = new Set(plates);
    this.updateInertiaTensor();
  }

  serialize(): ISerializedPlateGroup {
    return {
      plateIds: Array.from(this.plates).map(plate => plate.id),
      mass: this.mass,
      momentOfInertia: this.momentOfInertia.toArray(),
      invMomentOfInertia: this.invMomentOfInertia.toArray(),
    };
  }

  static deserialize(props: ISerializedPlateGroup, plates: Plate[]) {
    const plateGroup = new PlateGroup(plates);
    plateGroup.mass = props.mass;
    plateGroup.momentOfInertia = (new THREE.Matrix3()).fromArray(props.momentOfInertia);
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
    const momentOfInertiaValues = [0,0,0, 0,0,0, 0,0,0];

    this.plates.forEach(plate => {
      plate.updateInertiaTensor();
      plate.momentOfInertia.toArray().forEach((v, idx) => {
        momentOfInertiaValues[idx] += v;
      });
      this.mass += plate.mass;
    });

    this.momentOfInertia = new THREE.Matrix3();
    this.momentOfInertia.fromArray(momentOfInertiaValues);
    this.invMomentOfInertia = new THREE.Matrix3();
    this.invMomentOfInertia.copy(this.momentOfInertia).invert();
  }
}
