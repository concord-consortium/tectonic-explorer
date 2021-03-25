import getGrid from "./grid";
import Field from "./field";
import * as THREE from "three";

const FOLDING_STRESS_FACTOR = 500000;
const STRESS_SPREADING_FACTOR = 6;

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

  setCollision(field: Field) {
    this.calcFoldingStress(this.field.force);
    // This ensures that folding stress spreads nicely on both sides of the boundary.
    if (this.field.density > field.density && field.orogeny) {
      field.orogeny.setFoldingStress(this.maxFoldingStress);
    }
  }

  calcFoldingStress(force: THREE.Vector3) {
    if (!force) return;
    const stress = Math.min(1, force.length() * FOLDING_STRESS_FACTOR / this.field.area);
    this.setFoldingStress(stress);
  }

  setFoldingStress(foldingStress: number) {
    if (this.maxFoldingStress < foldingStress) {
      // Orogeny is active only if the new folding stress is higher than the previous max.
      this.active = true;
      this.maxFoldingStress = foldingStress;
      this.spreadFoldingStress();
    }
  }

  spreadFoldingStress() {
    const adjStress = this.maxFoldingStress - (getGrid().fieldDiameter * STRESS_SPREADING_FACTOR);
    if (adjStress < 0.1) {
      return;
    }
    this.field.forEachNeighbor((field: Field) => {
      if (field.isOcean) {
        return;
      }
      if (!field.orogeny) {
        field.orogeny = new Orogeny(field);
      }
      field.orogeny.setFoldingStress(adjStress);
    });
  }
}
