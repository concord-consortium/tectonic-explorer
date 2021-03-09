import getGrid from "./grid";
import c from "../constants";
import config from "../config";
import FieldBase from "./field-base";
import Subduction, { ISerializedSubduction } from "./subduction";
import Orogeny, { ISerializedOrogeny } from "./orogeny";
import Earthquake, { ISerializedEarthquake } from "./earthquake";
import VolcanicEruption, { ISerializedVolcanicEruption } from "./volcanic-eruption";
import VolcanicActivity, { ISerializedVolcanicAct } from "./volcanic-activity";
import { basicDrag, orogenicDrag } from "./physics/forces";
import Plate from "./plate";
import Subplate from "./subplate";
import Crust, { ISerializedCrust } from "./crust";

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
}

// Almost all the properties are optional, as serialization and deserialization automatically optimizes `undefined`, `false` 
// and `0` values, so the serialized model can be smaller.
export interface ISerializedField {
  id?: number;
  age?: number;
  _type?: number;
  boundary?: boolean;
  marked?: boolean;
  noCollisionDist?: number;
  originalHue?: number;
  crust: ISerializedCrust;
  orogeny?: ISerializedOrogeny;
  subduction?: ISerializedSubduction;
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

// Max age of the field defines how fast the new oceanic crust cools down and goes from ridge elevation to its base elevation.
export const MAX_AGE = config.oceanicRidgeWidth / c.earthRadius;

// Decides how tall volcanoes become during subduction.
const VOLCANIC_ACTIVITY_STRENGTH = 0.7;
// Decides how tall mountains become during continent-continent collision.
const OROGENY_STRENGTH = 0.4;

const FIELD_TYPE: Record<FieldType, number> = {
  ocean: 0,
  continent: 1,
  island: 2
};

const FIELD_TYPE_NAME: Record<number, FieldType> = Object.keys(FIELD_TYPE).reduce((res: Record<number, FieldType>, key: FieldType) => {
  res[FIELD_TYPE[key]] = key;
  return res;
}, {});

// Adjust mass of the field, so simulation works well with given force values.
const MASS_MODIFIER = 0.000005;

export default class Field extends FieldBase {
  plate: Plate | Subplate;

  area: number = c.earthArea / getGrid().size; // in km^2;
  boundary = false;

  // Set in constructor.
  _type: number;
  age: number;
  marked: boolean;
  originalHue?: number = undefined;

  // Geological properties. 
  // PJ: Why are these values set explicitly to undefined? As of Feb 26th 2021, this makes model work twice as fast 
  // as compared to version when they're left undefined... I can't see any reasonable explanation except for the
  // fact that it might get translated and optimized differently.
  orogeny?: Orogeny = undefined;
  subduction?: Subduction = undefined;
  volcanicAct?: VolcanicActivity = undefined;
  earthquake?: Earthquake = undefined;
  // An active & visible volcanic eruption, not just rising magma.
  volcanicEruption?: VolcanicEruption = undefined;
  crust: Crust;
  
  adjacentFields: number[];
  // Used by adjacent fields only (see model.generateTrenchesAndNewFields).
  noCollisionDist = 0;

  // Properties that are not serialized and can be derived from other properties and model state.
  alive = true; // "dead" fields are immediately removed from plate
  colliding: false | Field = false;
  draggingPlate?: Plate; // calculated during collision detection
  isContinentBuffer = false;

  constructor({ id, plate, crustThickness, originalHue, age = 0, type = "ocean", marked = false }: IFieldOptions) {
    super(id, plate);
    this.type = type;
    this.age = age;
    // Sometimes field can be moved from one plate to another (island-continent collision).
    // This info is used for rendering plate colors. For now, we need only color. If more properties should be
    // saved in the future, we should rethink this approach.
    this.originalHue = originalHue;
    // Some fields can be marked. It seems to be view-specific property, but this marker can be transferred between
    // fields in some cases (e.g. island being squeezed into some continent).
    this.marked = marked;
  
    const baseCrustThickness = crustThickness !== undefined ? 
      crustThickness : (this.type === "ocean" ? BASE_OCEANIC_CRUST_THICKNESS * this.normalizedAge : BASE_CONTINENTAL_CRUST_THICKNESS);
    this.crust = new Crust(type, baseCrustThickness);
  }

  serialize(): ISerializedField {
    // There's lots of fields in the model, so this optimization here makes sense.
    return removeUndefinedValues({
      id: this.id,
      boundary: this.boundary,
      age: this.age,
      _type: this._type,
      marked: this.marked,
      noCollisionDist: this.noCollisionDist,
      originalHue: this.originalHue,
      crust: this.crust.serialize(),
      orogeny: this.orogeny?.serialize(),
      subduction: this.subduction?.serialize(),
      volcanicAct: this.volcanicAct?.serialize(),
      earthquake: this.earthquake?.serialize(),
      volcanicEruption: this.volcanicEruption?.serialize()
    });
  }

  static deserialize(props: ISerializedField, plate: Plate | Subplate) {
    const field = new Field({ id: props.id || 0, plate });
    field.boundary = props.boundary || false;
    field.age = props.age || 0;
    field._type = props._type || 0;
    field.marked = props.marked || false;
    field.noCollisionDist = props.noCollisionDist || 0;
    field.originalHue = props.originalHue;
    field.crust = Crust.deserialize(props.crust);
    field.orogeny = props.orogeny && Orogeny.deserialize(props.orogeny, field);
    field.subduction = props.subduction && Subduction.deserialize(props.subduction, field);
    field.volcanicAct = props.volcanicAct && VolcanicActivity.deserialize(props.volcanicAct, field);
    field.earthquake = props.earthquake && Earthquake.deserialize(props.earthquake, field);
    field.volcanicEruption = props.volcanicEruption && VolcanicEruption.deserialize(props.volcanicEruption);
    return field;
  }

  clone() {
    const clone = Field.deserialize(this.serialize(), this.plate);
    clone.draggingPlate = this.draggingPlate;
    return clone;
  }

  set type(value: FieldType) {
    this._type = FIELD_TYPE[value];
  }

  get type() {
    return FIELD_TYPE_NAME[this._type];
  }

  get isOcean() {
    return this._type === FIELD_TYPE.ocean;
  }

  get isContinent() {
    return this._type === FIELD_TYPE.continent;
  }

  get isIsland() {
    return this._type === FIELD_TYPE.island;
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
    return this.isOcean;
  }

  get continentalCrust() {
    return this.isContinent || this.isIsland;
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
    if (this.isOcean) {
      if (this.subduction) {
        modifier = config.subductionMinElevation * this.subduction.progress;
      } else if (this.normalizedAge < 1) {
        // age = 0 => oceanicRidgeElevation
        // age = 1 => base elevation
        modifier = config.oceanicRidgeElevation * (1 - this.normalizedAge);
      }
    }
    return crustThicknessToElevation(this.crustThickness) + modifier;
  }

  get mountainElevation() {
    if (this.continentalCrust) {
      const potentialVolcanicEruption = (this.volcanicAct?.value) || 0;
      const mountain = (this.orogeny?.maxFoldingStress) || 0;
      return 0.4 * Math.max(potentialVolcanicEruption, mountain);
    }
    return 0;
  }

  get crustThickness() {
    return this.crust.thickness;
  }

  get crustCanBeStretched() {
    return this.isContinent && this.crustThickness - config.continentalStretchingRatio * getGrid().fieldDiameter > MIN_CONTINENTAL_CRUST_THICKNESS;
  }

  get lithosphereThickness() {
    if (this.isOcean) {
      return 0.7 * this.normalizedAge;
    }
    return 0.7;
  }

  setDefaultProps() {
    this.orogeny = undefined;
    this.volcanicAct = undefined;
    this.subduction = undefined;
    this.crust = new Crust(this.type, this.type === "ocean" ? BASE_OCEANIC_CRUST_THICKNESS : BASE_CONTINENTAL_CRUST_THICKNESS);
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
  forEachNeighbour(callback: (field: Field) => void) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field) {
        callback(field);
      }
    }
  }

  anyNeighbour(condition: (field: Field) => boolean) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field && condition(field)) {
        return true;
      }
    }
    return false;
  }

  avgNeighbour(property: keyof Field) {
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

  // One of the neighbouring fields, pointed by linear velocity vector.
  neighbourAlongVector(direction: THREE.Vector3) {
    const posOfNeighbour = this.absolutePos.clone().add(direction.clone().setLength(getGrid().fieldDiameter));
    return this.plate.fieldAtAbsolutePos(posOfNeighbour);
  }

  // Number of adjacent fields that actually belong to the plate.
  neighboursCount() {
    let count = 0;
    for (const adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        count += 1;
      }
    }
    return count;
  }

  get density() {
    return this.plate.density;
  }

  performGeologicalProcesses(timestep: number) {
    if (this.subduction) {
      this.subduction.update(timestep);
      if (!this.subduction.active) {
        // Don't keep old subduction objects.
        this.subduction = undefined;
      }
    }
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

    // Crust update.
    if (this.type === "ocean" && this.normalizedAge < 1) {
      // Basalt and gabbro are added only at the beginning of oceanic crust lifecycle.
      this.crust.addBasaltAndGabbro(BASE_OCEANIC_CRUST_THICKNESS * ageDiff / MAX_AGE);
    }
    if (this.volcanicAct?.active) {
      this.crust.addVolcanicRocks(this.volcanicAct.speed * timestep * VOLCANIC_ACTIVITY_STRENGTH);
    }
    if (this.orogeny) {
      // Folding reflects forces acting on the crust and results in crust getting thicker / taller => mountains.
      this.crust.setFolding(this.orogeny.maxFoldingStress * OROGENY_STRENGTH);
    }
  }

  resetCollisions() {
    this.colliding = false;
    this.draggingPlate = undefined;
    this.subduction?.resetCollision();
    this.volcanicAct?.resetCollision();
    this.orogeny?.resetCollision();
  }
}
