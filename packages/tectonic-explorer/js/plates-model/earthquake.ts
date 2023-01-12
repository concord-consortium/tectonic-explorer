import config from "../config";
import { random } from "../seedrandom";
import getGrid from "./grid";
import Field from "./field";

export interface ISerializedEarthquake {
  magnitude: number;
  depth: number;
  lifespan: number;
}

export const MIN_DEPTH = 0.05;
const SHALLOW_EQ_PROBABILITY = 0.15;

export default class Earthquake {
  depth: number;
  lifespan: number;
  magnitude: number;
  shallow: boolean;
  
  static shouldCreateEarthquake(field: Field) {
    const grid = getGrid();
    // There are two cases possible:
    // A. Field is in the subduction zone. Then, the earthquake should be more likely to show up when the subduction
    //    is progressing faster (relative speed between plates is higher).
    const subductionProgress = field.subductingFieldUnderneath?.subduction.progress;
    const relativeVelocity = field.subductingFieldUnderneath?.subduction.relativeVelocity?.length() || 0;
    if (subductionProgress && subductionProgress < 0.65) {
      return random() < relativeVelocity * config.earthquakeInSubductionZoneProbability * grid.fieldDiameter * config.timestep;
    }
    // B. Field is next to the divergent boundary. Then, the earthquake should be more likely to show up when the
    //    plate is moving faster and divergent boundary is more visible.
    if (field.divergentBoundaryZone) {
      return random() < field.linearVelocity.length() * config.earthquakeInDivergentZoneProbability * grid.fieldDiameter * config.timestep;
    }
    return false;
  }

  constructor(field: Field) {
    // Earthquake can be shallow or deep. Shallow are placed around top plate crust, while deep are placed
    // where two plates are colliding (so we use colliding field elevation as a base).
    const subductingField = field.subductingFieldUnderneath;
    if (subductingField) {
      // Subduction zone
      // Earthquakes can be "shallow" or "deep". Shallow earthquake take place in the lithosphere of the top plate.
      // "Deep" earthquakes take place around lithosphere of the subducting plate, so where the collision happens.
      // Earthquakes are always attached to the top plate, as that's where they are felt and registered. That makes
      // visualization better too, as earthquakes won't be moving together with the subducting plate.
      // Also, make sure that shallow earthquakes don't show up in trench-areas, as cross section would look confusing.
      const beforeTrench = field.elevation < subductingField.elevation;
      const shallow = beforeTrench || random() < SHALLOW_EQ_PROBABILITY;
      const baseField = shallow && !beforeTrench ? field : subductingField;
      const minDepth = Math.min(MIN_DEPTH, baseField.crustThickness + (shallow ? 0 : baseField.lithosphereThickness));
      const availableRange = baseField.crustThickness + (shallow ? 0 : baseField.lithosphereThickness) - minDepth;
      this.depth = Math.max(
        config.crossSectionMinElevation + random() * 0.1, // add some variation not to create regular cut off line
        baseField.elevation - minDepth - random() * availableRange
      );
      this.shallow = shallow;
    } else {
      // Divergent boundary. Crust and lithosphere can be really think here.
      const minDepth = Math.min(MIN_DEPTH, field.crustThickness + field.lithosphereThickness);
      const availableRange = field.crustThickness + field.lithosphereThickness - minDepth;
      this.depth = field.elevation - minDepth - random() * availableRange;
    }
    this.magnitude = 1 + random() * 8;
    this.lifespan = config.earthquakeLifespan;
  }

  get active() {
    return this.lifespan > 0;
  }

  serialize(): ISerializedEarthquake {
    return {
      depth: this.depth,
      magnitude: this.magnitude,
      lifespan: this.lifespan
    };
  }

  static deserialize(props: ISerializedEarthquake, field: Field) {
    const eq = new Earthquake(field);
    eq.depth = props.depth;
    eq.magnitude = props.magnitude;
    eq.lifespan = props.lifespan;
    return eq;
  }

  update(timestep: number) {
    this.lifespan -= timestep;
  }
}
