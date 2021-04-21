import { random } from "../seedrandom";
import Field from "./field";

export interface ISerializedVolcanicAct {
  deformingCapacity: number;
  volcanoCapacity: number;
  // .intensity and .colliding are dynamically calculated every simulation step.
}

// Max time that given field can undergo volcanic activity.
const MAX_DEFORMING_TIME = 12; // model time
const MAX_VOLCANO_DEFORMING_TIME = 7; // model time
// This parameter changes how intense and visible is the volcanic activity.
const INTENSITY_FACTOR = 0.15;
// This param can be used to change number of volcanoes.
const VOLCANO_PROBABILITY_FACTOR = 1.5;

// Set of properties related to volcanic activity. Used by Field instances.
export default class VolcanicActivity {
  field: Field;
  deformingCapacity: number;
  volcanoCapacity: number;
  intensity: number;
  colliding: false | Field;

  constructor(field: Field) {
    this.field = field;
    this.intensity = 0;
    this.colliding = false;
    // When field undergoes volcanic activity, this attribute is going lower and lower
    // and at some point field will be "frozen" won't be able to undergo any more processes.
    // It ensures that mountains don't grow too big and there's some variation between fields.
    // Deforming capacity is lower when the field has already a high elevation.
    this.deformingCapacity = MAX_DEFORMING_TIME / (1 + field.elevation);
    this.volcanoCapacity = 0;
  }

  serialize(): ISerializedVolcanicAct {
    return {
      deformingCapacity: this.deformingCapacity,
      volcanoCapacity: this.volcanoCapacity
    };
  }

  static deserialize(props: ISerializedVolcanicAct, field: Field) {
    const vAct = new VolcanicActivity(field);
    vAct.deformingCapacity = props.deformingCapacity;
    vAct.volcanoCapacity = props.volcanoCapacity;
    return vAct;
  }
 
  get active() {
    return this.intensity > 0 && this.deformingCapacity + this.volcanoCapacity > 0;
  }

  get risingMagma() {
    return this.volcanoCapacity > 0;
  }

  get volcanoProbability() {
    if (!this.active) {
      return 0;
    }
    return this.intensity * VOLCANO_PROBABILITY_FACTOR;
  }

  setCollision(field: Field) {
    this.colliding = field;
    // Volcanic activity is the strongest in the middle of subduction distance / progress.
    if (field.subduction) {
      let r = field.subduction.progress; // [0, 1]
      if (r > 0.5) r = 1 - r;
      this.intensity = Math.sqrt(r) * INTENSITY_FACTOR;
    }
  }

  resetCollision() {
    // Needs to be reactivated during next collision.
    this.colliding = false;
    this.intensity = 0;
  }

  update(timestep: number) {
    if (!this.active) {
      return;
    }

    if (this.volcanoCapacity === 0 && random() < this.volcanoProbability * timestep) {
      this.volcanoCapacity += random() * MAX_VOLCANO_DEFORMING_TIME;
    }

    this.deformingCapacity -= timestep;
  }
}
