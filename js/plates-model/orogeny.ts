import Field from "./field";
import * as THREE from "three";

const FOLDING_STRESS_FACTOR = 500000000;

export interface ISerializedOrogeny {
  maxFoldingStress: number;
}

// Set of properties related to orogenesis. Used by Field instances.
export default class Orogeny {
  field: Field;
  maxFoldingStress: number;
  active = false;

  constructor(field: Field) {
    this.field = field;
    this.maxFoldingStress = 0;
  }

  serialize(): ISerializedOrogeny {
    return {
      maxFoldingStress: this.maxFoldingStress
    };
  }

  static deserialize(props: ISerializedOrogeny, field: Field) {
    const orogeny = new Orogeny(field);
    orogeny.maxFoldingStress = props.maxFoldingStress;
    return orogeny;
  }

  resetCollision() {
    this.active = false;
  }

  setCollision() {
    this.calcFoldingStress(this.field.force);
  }

  calcFoldingStress(force: THREE.Vector3) {
    if (!force) return;
    const stress = Math.min(1, force.length() * FOLDING_STRESS_FACTOR / this.field.area);
    if (stress > this.maxFoldingStress) {
      // Orogeny is active only if the new folding stress is higher than the previous max.
      this.active = true;
      this.maxFoldingStress = stress;
    }
  }
}
