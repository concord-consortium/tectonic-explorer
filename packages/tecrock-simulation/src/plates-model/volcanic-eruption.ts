import config from "../config";
import { random } from "../seedrandom";
import getGrid from "./grid";
import Field from "./field";

export interface ISerializedVolcanicEruption {
  lifespan: number;
}

export default class VolcanicEruption {
  lifespan: number;

  // There are two cases possible:
  // A. Field is in the subduction zone. This logic is handled by VolcanicActivity helper.
  // B. Field is next to the divergent boundary. This logic is handled by this class. 
  static shouldCreateVolcanicEruption(field: Field) {
    const grid = getGrid();
    // The volcanic eruption should be more likely to show up when the plate is moving faster and the divergent boundary is more visible.
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
