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

export type FieldType = "ocean" | "continent" | "island";

export type FieldWithSubduction = Field & { subduction: Subduction };

export interface IFieldOptions {
  id: number;
  plate: Plate | Subplate;
  age?: number;
  type?: FieldType;
  elevation?: number;
  crustThickness?: number;
  originalHue?: number;
  marked?: boolean;
}

// All the properties are optional, as serialization and deserialization automatically optimizes `undefined`, `false` 
// and `0` values, so the serialized model can be smaller.
export interface ISerializedField {
  id?: number;
  age?: number;
  _type?: number;
  baseElevation?: number;
  baseCrustThickness?: number;
  boundary?: boolean;
  trench?: boolean;
  marked?: boolean;
  noCollisionDist?: number;
  originalHue?: number;
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

// Max age of the field defines how fast the new oceanic crust cools down and goes from ridge elevation to its base elevation.
export const MAX_AGE = config.oceanicRidgeWidth / c.earthRadius;
// When a continent is splitting apart along divergent boundary, its crust will get thinner and thinner
// until it reaches this value. Then the oceanic crust will be formed instead.
export const MIN_CONTINENTAL_CRUST_THICKNESS = 0.45;

const FIELD_TYPE: Record<FieldType, number> = {
  ocean: 0,
  continent: 1,
  island: 2
};

const FIELD_TYPE_NAME: Record<number, FieldType> = Object.keys(FIELD_TYPE).reduce((res: Record<number, FieldType>, key: FieldType) => {
  res[FIELD_TYPE[key]] = key;
  return res;
}, {});

const ELEVATION: Record<FieldType, number> = {
  ocean: 0.0,
  // sea level: 0.5
  continent: 0.55,
  island: 0.55
};

// Adjust mass of the field, so simulation works well with given force values.
const MASS_MODIFIER = 0.000005;

export default class Field extends FieldBase {
  plate: Plate | Subplate;

  area: number = c.earthArea / getGrid().size; // in km^2;
  boundary = false;
  trench = false;

  _type: number;
  age: number;
  baseCrustThickness: number;
  baseElevation: number;
  marked: boolean;
  originalHue?: number;

  // Geological properties.
  orogeny?: Orogeny;
  subduction?: Subduction;
  volcanicAct?: VolcanicActivity;
  earthquake?: Earthquake;
  // An active & visible volcanic eruption, not just rising magma.
  volcanicEruption?: VolcanicEruption;
  
  adjacentFields: number[];
  // Used by adjacent fields only (see model.generateNewFields).
  noCollisionDist = 0;

  // Properties that are not serialized and can be derived from other properties and model state.
  alive = true; // "dead" fields are immediately removed from plate
  colliding: false | Field = false;
  draggingPlate?: Plate; // calculated during collision detection
  isContinentBuffer = false;

  constructor({ id, plate, elevation, crustThickness, originalHue, age = 0, type = "ocean", marked = false }: IFieldOptions) {
    super(id, plate);
    this.type = type;
    this.age = age;
    this.baseElevation = elevation !== undefined ? elevation : this.defaultElevation;
    this.baseCrustThickness = crustThickness !== undefined ? crustThickness : this.defaultCrustThickness;
    // Sometimes field can be moved from one plate to another (island-continent collision).
    // This info is used for rendering plate colors. For now, we need only color. If more properties should be
    // saved in the future, we should rethink this approach.
    this.originalHue = originalHue;
    // Some fields can be marked. It seems to be view-specific property, but this marker can be transferred between
    // fields in some cases (e.g. island being squeezed into some continent).
    this.marked = marked;
  }

  serialize(): ISerializedField {
    // There's lots of fields in the model, so this optimization here makes sense.
    return removeUndefinedValues({
      id: this.id,
      boundary: this.boundary,
      age: this.age,
      _type: this._type,
      baseElevation: this.baseElevation,
      baseCrustThickness: this.baseCrustThickness,
      trench: this.trench,
      marked: this.marked,
      noCollisionDist: this.noCollisionDist,
      originalHue: this.originalHue,
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
    field.baseElevation = props.baseElevation || 0;
    field.baseCrustThickness = props.baseCrustThickness || 0;
    field.trench = props.trench || false;
    field.marked = props.marked || false;
    field.noCollisionDist = props.noCollisionDist || 0;
    field.originalHue = props.originalHue;
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
  //  - [0, 1] -> [the deepest trench, the highest mountain]
  //  - 0.5 -> sea level
  //  - [config.subductionMinElevation, 0] -> subduction
  get elevation() {
    let modifier = 0;
    if (this.isOcean) {
      if (this.subduction) {
        modifier = config.subductionMinElevation * this.subduction.progress;
      } else if (this.normalizedAge < 1) {
        // age = 0 => oceanicRidgeElevation
        // age = 1 => baseElevation
        modifier = (config.oceanicRidgeElevation - this.baseElevation) * (1 - this.normalizedAge);
      }
    } else {
      modifier += this.mountainElevation;
    }
    if (this.trench) {
      modifier = -1.5;
    }
    return Math.min(1, this.baseElevation + modifier);
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
    if (this.trench) {
      return 0.1;
    }
    if (this.isOcean) {
      return this.baseCrustThickness * this.normalizedAge;
    } else {
      return this.baseCrustThickness + this.mountainElevation * 2; // mountain roots
    }
  }

  get crustCanBeStretched() {
    return this.isContinent && this.crustThickness > MIN_CONTINENTAL_CRUST_THICKNESS;
  }

  get lithosphereThickness() {
    if (this.trench) {
      return 0.1;
    }
    if (this.isOcean) {
      return 0.7 * this.normalizedAge;
    }
    return 0.7;
  }

  get defaultElevation() {
    return ELEVATION[this.type];
  }

  get defaultCrustThickness() {
    return this.type === "ocean" ? 0.2 : this.baseElevation;
  }

  setDefaultProps() {
    this.baseElevation = this.defaultElevation;
    this.baseCrustThickness = this.defaultCrustThickness;
    this.orogeny = undefined;
    this.volcanicAct = undefined;
    this.subduction = undefined;
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
    const trenchPossible = this.boundary && this.subductingFieldUnderneath && !this.orogeny;
    if (this.trench && !trenchPossible) {
      // Remove trench when field isn't boundary anymore. Or when it collides with other continent and orogeny happens.
      this.trench = false;
    }
    if (!this.trench && trenchPossible) {
      this.trench = true;
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
    this.age += this.displacement(timestep).length();
  }

  resetCollisions() {
    this.colliding = false;
    this.draggingPlate = undefined;
    if (this.subduction) {
      this.subduction.resetCollision();
    }
    if (this.volcanicAct) {
      this.volcanicAct.resetCollision();
    }
  }
}
