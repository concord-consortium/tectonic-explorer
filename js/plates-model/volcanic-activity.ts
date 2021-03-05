import { random } from "../seedrandom";
import markIslands from "./mark-islands";
import Field from "./field";

export interface ISerializedVolcanicAct {
  value: number;
  deformingCapacity: number;
  // .speed and .colliding are dynamically calculated every simulation step.
}

// Max time that given field can undergo volcanic activity.
const MAX_DEFORMING_TIME = 15; // model time

// Set of properties related to volcanic activity. Used by Field instances.
export default class VolcanicActivity {
  field: Field;
  deformingCapacity: number;
  value: number;
  speed: number;
  colliding: false | Field;

  constructor(field: Field) {
    this.field = field;
    this.value = 0; // [0, 1]
    this.speed = 0;
    this.colliding = false;
    // When field undergoes volcanic activity, this attribute is going lower and lower
    // and at some point field will be "frozen" won't be able to undergo any more processes.
    // It ensures that mountains don't grow too big and there's some variation between fields.
    this.deformingCapacity = MAX_DEFORMING_TIME;
  }

  serialize(): ISerializedVolcanicAct {
    return {
      value: this.value,
      deformingCapacity: this.deformingCapacity
    };
  }

  static deserialize(props: ISerializedVolcanicAct, field: Field) {
    const vAct = new VolcanicActivity(field);
    vAct.value = props.value;
    vAct.deformingCapacity = props.deformingCapacity;
    return vAct;
  }

  get active() {
    return this.speed > 0 && this.deformingCapacity > 0;
  }

  get risingMagma() {
    // (this.value > 0.85 || this.field.isIsland) => highest part of the volcanic mountain (continent) OR an island
    return this.field.continentalCrust && this.colliding && (this.value > 0.85 || this.field.isIsland);
  }

  get islandProbability() {
    if (!this.active || this.field.trench) return 0;
    return this.value / 20;
  }

  setCollision(field: Field) {
    this.colliding = field;
    // Volcanic activity is the strongest in the middle of subduction distance / progress.
    if (field.subduction) {
      let r = field.subduction.progress; // [0, 1]
      if (r > 0.5) r = 1 - r;
      // Magic number 0.43 ensures that volcanoes get visible enough. If it's lower, they don't grow enough,
      // if it's bigger, they get too big and too similar to each other.
      r = r / (MAX_DEFORMING_TIME * 0.43);
      this.speed = r;
    }
  }

  resetCollision() {
    // Needs to be reactivated during next collision.
    this.colliding = false;
    this.speed = 0;
  }

  update(timestep: number) {
    if (!this.active) {
      return;
    }

    this.value += this.speed * timestep;
    if (this.value > 1) {
      this.value = 1;
    }

    if (this.field.isOcean && random() < this.islandProbability * timestep) {
      this.field.type = "island";
      // Make sure that this is still an island. If it's placed next to other islands, their total area
      // might exceed maximal area of the island and we should treat it as a continent.
      markIslands(this.field);
    }

    this.deformingCapacity -= timestep;
  }
}
