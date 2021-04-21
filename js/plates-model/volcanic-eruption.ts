import config from "../config";
import { random } from "../seedrandom";
import getGrid from "./grid";
import Field from "./field";

export interface ISerializedVolcanicEruption {
  lifespan: number;
}

export default class VolcanicEruption {
  lifespan: number;

  static shouldCreateVolcanicEruption(field: Field) {
    const grid = getGrid();
    // There are two cases possible:
    // A. Field is in the subduction zone. Then, the volcanic eruption should be more likely to show up when the subduction
    //    is progressing faster (relative speed between plates is higher).
    if (field.risingMagma && field.subductingFieldUnderneath) {
      const relVelocity = field.subductingFieldUnderneath.subduction.relativeVelocity?.length() || 0;
      return random() < relVelocity * config.volcanicEruptionOnContinentProbability * grid.fieldDiameter * config.timestep;
    }
    // B. Field is next to the divergent boundary. Then, the volcanic eruption should be more likely to show up when the
    //    plate is moving faster and divergent boundary is more visible.
    if (field.divergentBoundaryVolcanicZone) {
      return random() < field.linearVelocity.length() * config.volcanicEruptionInDivergentZoneProbability * grid.fieldDiameter * config.timestep;
    }
    return false;
  }

  constructor() {
    this.lifespan = config.volcanicEruptionLifespan;
  }

  get active() {
    return this.lifespan > 0;
  }

  serialize(): ISerializedVolcanicEruption {
    return {
      lifespan: this.lifespan
    };
  }

  static deserialize(props: ISerializedVolcanicEruption) {
    const ve = new VolcanicEruption();
    ve.lifespan = props.lifespan;
    return ve;
  }

  update(timestep: number) {
    this.lifespan -= timestep;
  }
}
