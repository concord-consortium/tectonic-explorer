import getGrid from "./grid";
import c from "../constants";
import config from "../config";
import FieldBase from "./field-base";
import Subduction, { ISerializedSubduction } from "./subduction";
import Earthquake, { ISerializedEarthquake } from "./earthquake";
import VolcanicEruption, { ISerializedVolcanicEruption } from "./volcanic-eruption";
import VolcanicActivity, { ISerializedVolcanicAct } from "./volcanic-activity";
import { basicDrag, orogenicDrag } from "./physics/forces";
import Plate from "./plate";
import Subplate from "./subplate";
import Crust, { ISerializedCrust, MAX_CRUST_THICKNESS_BASE, MAX_REGULAR_SEDIMENT_THICKNESS } from "./crust";

export type FieldType = "ocean" | "continent" | "island";

export type FieldWithSubduction = Field & { subduction: Subduction };

export interface IFieldOptions {
  id: number;
  plate: Plate | Subplate;
  age?: number;
  type?: FieldType;
  crustThickness?: number;
  originalHue?: number;
  marked?: boolean;
  bendingProgress?: number;
  adjacent?: boolean;
}

// Almost all the properties are optional, as serialization and deserialization automatically optimizes `undefined`, `false` 
// and `0` values, so the serialized model can be smaller.
export interface ISerializedField {
  id?: number;
  age?: number;
  boundary?: boolean;
  marked?: boolean;
  noCollisionDist?: number;
  originalHue?: number;
  crust: ISerializedCrust;
  subduction?: ISerializedSubduction;
  bendingProgress?: number;
  shouldPropagateBending?: boolean;
  volcanicAct?: ISerializedVolcanicAct;
  earthquake?: ISerializedEarthquake;
  volcanicEruption?: ISerializedVolcanicEruption;
}

const removeUndefinedValues = (obj: any) =>  {
  Object.keys(obj).forEach(key => (obj[key] === undefined || obj[key] === false || obj[key] === 0) && delete obj[key]);
  return obj;
};

export const crustThicknessToElevation = (crustThickness: number) =>
  crustThickness * CRUST_THICKNESS_TO_ELEVATION_RATIO - CRUST_BELOW_ZERO_ELEVATION;

export const elevationToCrustThickness = (elevation: number) => 
  (elevation + CRUST_BELOW_ZERO_ELEVATION) / CRUST_THICKNESS_TO_ELEVATION_RATIO;

// When any of these values is updated, most likely color scales in colormaps.ts will have to be updated too.
export const BASE_OCEAN_ELEVATION = 0;
export const SEA_LEVEL = 0.5;
export const BASE_CONTINENT_ELEVATION = 0.55;
export const HIGHEST_MOUNTAIN_ELEVATION = 1;

export const BASE_OCEANIC_CRUST_THICKNESS = 0.5; // in real world: 6-12km, 7-10km on average
// This constant will decide how deep are the mountain roots.
export const CRUST_THICKNESS_TO_ELEVATION_RATIO = 0.5;
// This constant shifts elevation so the base oceanic crust is at elevation BASE_OCEAN_ELEVATION (in model units, compare that with SEA_LEVEL value).
export const CRUST_BELOW_ZERO_ELEVATION = BASE_OCEANIC_CRUST_THICKNESS * CRUST_THICKNESS_TO_ELEVATION_RATIO - BASE_OCEAN_ELEVATION;
// Base continental crust is calculated from elevation to ensure that continents are above SEA_LEVEL.
export const BASE_CONTINENTAL_CRUST_THICKNESS = elevationToCrustThickness(BASE_CONTINENT_ELEVATION); // in real world: 30-70km, 35km on average
// When a continent is splitting apart along divergent boundary, its crust will get thinner and thinner
// until it reaches this value. Then the oceanic crust will be formed instead.
export const MIN_CONTINENTAL_CRUST_THICKNESS = BASE_OCEANIC_CRUST_THICKNESS * 1.1;

export const LITHOSPHERE_THICKNESS = 0.7;

export const NEW_OCEANIC_CRUST_THICKNESS_RATIO = 0.6;

export const TRENCH_MAX_DEPTH = 0.085;
export const TRENCH_SLOPE = 0.5;

// Max age of the field defines how fast the new oceanic crust cools down and goes from ridge elevation to its base elevation.
export const MAX_AGE = config.oceanicRidgeWidth / c.earthRadius;

// Decides how tall volcanoes become during subduction.
const VOLCANIC_ACTIVITY_STRENGTH = 0.1;

// Adjust mass of the field, so simulation works well with given force values.
const MASS_MODIFIER = 0.000005;

export default class Field extends FieldBase {
  plate: Plate | Subplate;

  area: number = c.earthArea / getGrid().size; // in km^2;
  boundary = false;

  // Set in constructor.
  age: number;
  marked: boolean;
  originalHue?: number = undefined;

  // Geological properties. 
  // PJ: Why are these values set explicitly to undefined? As of Feb 26th 2021, this makes model work twice as fast 
  // as compared to version when they're left undefined... I can't see any reasonable explanation except for the
  // fact that it might get translated and optimized differently.
  subduction?: Subduction = undefined;
  // bendingProgress is kept outside Subduction helper, as the plate can start bending even before
  // colliding with another plate. The subduction affects neighboring fields and pushes them down. 
  bendingProgress = 0;
  shouldPropagateBending = false;
  volcanicAct?: VolcanicActivity = undefined;
  earthquake?: Earthquake = undefined;
  // An active & visible volcanic eruption, not just rising magma.
  volcanicEruption?: VolcanicEruption = undefined;
  crust: Crust;
  
  adjacentFields: number[];
  // Used by adjacent fields only (see model.generateNewFields).
  noCollisionDist = 0;

  // Properties that are not serialized and can be derived from other properties and model state.
  alive = true; // "dead" fields are immediately removed from plate
  colliding: false | Field = false;
  draggingPlate?: Plate; // calculated during collision detection
  isContinentBuffer = false;

  constructor({ id, plate, crustThickness, originalHue, age = 0, type = "ocean", marked = false, adjacent = false }: IFieldOptions) {
    super(id, plate);

    this.age = age;
    // Sometimes field can be moved from one plate to another (island-continent collision).
    // This info is used for rendering plate colors. For now, we need only color. If more properties should be
    // saved in the future, we should rethink this approach.
    this.originalHue = originalHue;
    // Some fields can be marked. It seems to be view-specific property, but this marker can be transferred between
    // fields in some cases (e.g. island being squeezed into some continent).
    this.marked = marked;
  
    const baseCrustThickness = crustThickness !== undefined ? 
      crustThickness : (type === "ocean" ? BASE_OCEANIC_CRUST_THICKNESS * (NEW_OCEANIC_CRUST_THICKNESS_RATIO + (1 - NEW_OCEANIC_CRUST_THICKNESS_RATIO) * this.normalizedAge) : BASE_CONTINENTAL_CRUST_THICKNESS);
    this.crust = new Crust(type, baseCrustThickness, this.normalizedAge === 1);

    // Adjacent is a special type of field that only tracks noCollisionDist. Eventually this field may become a "real" field.
    if (adjacent) {
      // This is only necessary to make testing easier. Adjacent fields are added and removed in a way that cannot
      // be captured and restored by some of te tests. maxCrustThickness is not used anyway, so avoid using random
      // value to make testing easier. TODO: refactor adjacent fields into separate, lighter class.
      this.crust.maxCrustThickness = MAX_CRUST_THICKNESS_BASE;
    }
  }

  serialize(): ISerializedField {
    // There's lots of fields in the model, so this optimization here makes sense.
    return removeUndefinedValues({
      id: this.id,
      boundary: this.boundary,
      age: this.age,
      marked: this.marked,
      noCollisionDist: this.noCollisionDist,
      originalHue: this.originalHue,
      crust: this.crust.serialize(),
      subduction: this.subduction?.serialize(),
      bendingProgress: this.bendingProgress,
      shouldPropagateBending: this.shouldPropagateBending,
      volcanicAct: this.volcanicAct?.serialize(),
      earthquake: this.earthquake?.serialize(),
      volcanicEruption: this.volcanicEruption?.serialize()
    });
  }

  static deserialize(props: ISerializedField, plate: Plate | Subplate) {
    const field = new Field({ id: props.id || 0, plate });
    field.boundary = props.boundary || false;
    field.age = props.age || 0;
    field.marked = props.marked || false;
    field.noCollisionDist = props.noCollisionDist || 0;
    field.originalHue = props.originalHue;
    field.crust = Crust.deserialize(props.crust);
    field.subduction = props.subduction && Subduction.deserialize(props.subduction, field);
    field.bendingProgress = props.bendingProgress || 0;
    field.shouldPropagateBending = props.shouldPropagateBending || false;
    field.volcanicAct = props.volcanicAct && VolcanicActivity.deserialize(props.volcanicAct, field);
    field.earthquake = props.earthquake && Earthquake.deserialize(props.earthquake, field);
    field.volcanicEruption = props.volcanicEruption && VolcanicEruption.deserialize(props.volcanicEruption);
    return field;
  }

  clone(newId?: number, newPlate?: Plate | Subplate) {
    const props = this.serialize();
    if (newId !== undefined) {
      props.id = newId;
    }
    return Field.deserialize(props, newPlate || this.plate);
  }

  get mass() {
    return MASS_MODIFIER * this.area * (this.continentalCrust ? config.continentDensity : config.oceanDensity);
  }

  get subductingFieldUnderneath(): FieldWithSubduction | null {
    // Volcanic activity happens on the overriding plate. Just check if it's still colliding with subducting plate.
    // Note that we can't use general .colliding property. volcanicAct.colliding will be set only when there's
    // collision with subducting plate, while the general .colliding property marks any collision.
    if (this.volcanicAct?.colliding && this.volcanicAct?.colliding.subduction) {
      return this.volcanicAct.colliding as FieldWithSubduction;
    }
    return null;
  }

  get oceanicCrust() {
    return this.crust.hasOceanicRocks;
  }

  get continentalCrust() {
    return this.crust.hasContinentalRocks;
  }

  get risingMagma() {
    return this.volcanicAct?.risingMagma;
  }

  get force() {
    const force = basicDrag(this);
    if (this.draggingPlate) {
      force.add(orogenicDrag(this, this.draggingPlate));
    }
    return force;
  }

  get torque() {
    return this.absolutePos.clone().cross(this.force);
  }

  get normalizedAge() {
    return Math.min(1, this.age / MAX_AGE);
  }
  
  get rockType() {
    return this.crust.topRockType;
  }

  get divergentBoundaryZone() {
    // Earthquakes should happen around the oceanic ridge.
    return this.normalizedAge < 0.5;
  }

  get divergentBoundaryVolcanicZone() {
    // Volcanic eruptions should happen as close to the oceanic ridge as possible.
    return this.normalizedAge < 0.2;
  }

  // range: [config.subductionMinElevation, 1]
  //  - [0, 1] -> [average ocean, the highest mountain]
  //  - 0.5 -> sea level
  //  - [config.subductionMinElevation, 0] -> ocean trench and subduction range
  get elevation() {
    let modifier = 0;
    if (this.crust.hasOceanicRocks) {
      if (this.bendingProgress) {
        modifier += config.subductionMinElevation * this.bendingProgress;
      } 
      if (this.normalizedAge < 1) {
        // age = 0 => oceanicRidgeElevation
        // age = 1 => base elevation
        modifier += config.oceanicRidgeElevation * (1 - this.normalizedAge);
      }
    }
    return this.crust.thicknessAboveZeroElevation() - CRUST_BELOW_ZERO_ELEVATION + modifier;
  }

  get maxSlopeFactor() {
    const fieldDiameter = getGrid().fieldDiameter;
    let maxAngle = 0;
    this.forEachNeighbor(n => {
      const angle = (this.elevation - n.elevation) / fieldDiameter;
      if (angle > maxAngle) {
        maxAngle = angle;
      }
    });
    return maxAngle;
  }

  get crustThickness() {
    return this.crust.thickness;
  }

  get crustCanBeStretched() {
    return this.continentalCrust && this.crustThickness - config.continentalStretchingRatio * getGrid().fieldDiameter > MIN_CONTINENTAL_CRUST_THICKNESS;
  }

  get lithosphereThickness() {
    return LITHOSPHERE_THICKNESS * Math.sqrt(this.normalizedAge);
  }

  get isVolcanoErupting() {
    return this.volcanicAct?.erupting || this.volcanicEruption;
  }

  setDefaultProps(type: FieldType) {
    this.volcanicAct = undefined;
    this.subduction = undefined;
    this.crust = new Crust(type, type === "ocean" ? BASE_OCEANIC_CRUST_THICKNESS : BASE_CONTINENTAL_CRUST_THICKNESS);
  }

  setCrustThickness(value: number) {
    this.crust.setThickness(value);
  }

  displacement(timestep: number) {
    return this.linearVelocity.multiplyScalar(timestep);
  }

  isBoundary() {
    if (this.plate.isSubplate) {
      return false;
    }
    // At least one adjacent field of this field is an adjacent field of the whole plate.
    for (const adjId of this.adjacentFields) {
      if (this.plate.adjacentFields.has(adjId)) {
        return true;
      }
    }
    return false;
  }

  isAdjacentField() {
    // At least one adjacent field of this field belongs to the plate.
    for (const adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        return true;
      }
    }
    return false;
  }

  // Fields belonging to the parent plate.
  forEachNeighbor(callback: (field: Field) => void) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field) {
        callback(field);
      }
    }
  }

  anyNeighbor(condition: (field: Field) => boolean) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field && condition(field)) {
        return true;
      }
    }
    return false;
  }

  avgNeighbor(property: keyof Field) {
    let val = 0;
    let count = 0;
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field) {
        // No strict type checking. Generally this function isn't very safe.
        val += field[property] as any;
        count += 1;
      }
    }
    return val / count;
  }

  // One of the neighboring fields, pointed by linear velocity vector.
  neighborAlongVector(direction: THREE.Vector3) {
    const posOfNeighbor = this.absolutePos.clone().add(direction.clone().setLength(getGrid().fieldDiameter));
    return this.plate.fieldAtAbsolutePos(posOfNeighbor);
  }

  // Number of adjacent fields that actually belong to the plate.
  neighborsCount() {
    let count = 0;
    for (const adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        count += 1;
      }
    }
    return count;
  }

  getNeighboringCrust() {
    const result: Crust[] = [];
    this.forEachNeighbor(neigh => {
      // Skip fields that have bigger subduction progress. This function is used to generate neighbors that will
      // receive rocks, and this can happen only in one direction (towards subduction edge).
      if (!neigh.subduction || (this.subduction?.progress || 0) > neigh.subduction.progress) {
        result.push(neigh.crust);
      }
    });
    return result;
  }

  get density() {
    return this.plate.density;
  }

  performGeologicalProcesses(timestep: number) {
    const neighboringCrust = this.getNeighboringCrust();

    if (this.subduction) {
      this.subduction.update(timestep);
  
      if (!this.subduction.active) {
        // Don't keep old subduction objects.
        this.subduction = undefined;
        // It's important to reset bending progress if field somehow stopped subducting. It can happen around
        // N or S pole where fields can make a full circle if they're close enough to it - subduct and then reach 
        // the surface again before they're removed from the plate.
        this.bendingProgress = 0;
      } else {
        this.bendingProgress = this.subduction.progress + TRENCH_MAX_DEPTH;
        // Subducting fields should initiate plate bending.
        this.shouldPropagateBending = true;
      }
    }
    this.propagateBending();

    if (this.volcanicAct) {
      this.volcanicAct.update(timestep);
    }
    if (this.earthquake) {
      this.earthquake.update(timestep);
      if (!this.earthquake.active) {
        // Don't keep old earthquake objects.
        this.earthquake = undefined;
      }
    } else if (Earthquake.shouldCreateEarthquake(this)) {
      this.earthquake = new Earthquake(this);
    }
    if (this.volcanicEruption) {
      this.volcanicEruption.update(timestep);
      if (!this.volcanicEruption.active) {
        // Don't keep old volcanicEruption objects.
        this.volcanicEruption = undefined;
      }
    } else if (VolcanicEruption.shouldCreateVolcanicEruption(this)) {
      this.volcanicEruption = new VolcanicEruption();
    }
  
    // Age is a travelled distance in fact.
    const ageDiff = this.displacement(timestep).length();
    this.age += ageDiff;

    
    if (this.crust.hasOceanicRocks && this.normalizedAge < 1) {
      // Basalt and gabbro are added only at the beginning of oceanic crust lifecycle.
      this.crust.addBasaltAndGabbro((1 - NEW_OCEANIC_CRUST_THICKNESS_RATIO) * (BASE_OCEANIC_CRUST_THICKNESS - MAX_REGULAR_SEDIMENT_THICKNESS) * ageDiff / MAX_AGE);
    }
    if (this.volcanicAct?.active && this.volcanicAct.erupting) {
      this.crust.addVolcanicRocks(this.volcanicAct.intensity * timestep * VOLCANIC_ACTIVITY_STRENGTH);
      this.volcanicAct.deformingCapacity -= timestep;
    }
    if (!this.crust.canSubduct() && this.colliding && !this.colliding.crust.canSubduct() && this.colliding.subduction) {
      // Orogeny
      this.crust.transferRocks(timestep, this.colliding.crust, this.colliding.subduction.relativeVelocity);
      this.crust.fold(timestep, neighboringCrust, this.colliding.subduction.relativeVelocity);
      this.crust.setMetamorphic(1);
      this.colliding.crust.setMetamorphic(1);
    }
    if (this.subduction) {
      // Note that field is subducting both in case of a normal subduction (top plate is oceanic) and orogeny
      // (top plate is a continent).
      this.crust.subductOrFold(timestep, neighboringCrust, this.subduction.relativeVelocity);
    } else {
      if (this.elevation < SEA_LEVEL && this.normalizedAge === 1) {
        this.crust.addSediment(0.005 * timestep);
      }
      // When sediment layer is too thick, sediments will be transferred to neighbors.
      this.crust.spreadOceanicSediment(timestep, neighboringCrust);
    }
    this.crust.erode(timestep, neighboringCrust, this.maxSlopeFactor);
    this.crust.spreadMetamorphism(neighboringCrust);
  }    


  propagateBending() {
    if (!this.shouldPropagateBending) {
      return;
    }
    const possibleNeighBending = Math.max(0, this.bendingProgress - TRENCH_SLOPE * getGrid().fieldDiameter);
    const minAngle = Math.PI * 0.8; // limit allowed angle to pretty much opposite direction (0.8 * 180deg)
    this.forEachNeighbor((n) => {
      if (!n.subduction && n.bendingProgress < possibleNeighBending && 
        // This line below checks if vector that connects neighboring field with this one is pointing the opposite
        // direction than relative speed of the (subducting) plate. This ensures that plate bending progresses
        // against the plate movement direction. It makes sense and lets us avoid some unwanted effects. See:
        // https://www.pivotaltracker.com/story/show/178375945
        n.absolutePos.clone().sub(this.absolutePos).angleTo(this.plate.linearVelocity(this.absolutePos)) > minAngle) {
        n.bendingProgress = possibleNeighBending;
        // Continue bending propagation.
        n.shouldPropagateBending = true;
      }
    });
    this.shouldPropagateBending = false;
  }

  resetCollisions() {
    this.colliding = false;
    this.draggingPlate = undefined;
    this.subduction?.resetCollision();
    this.volcanicAct?.resetCollision();
  }
}
