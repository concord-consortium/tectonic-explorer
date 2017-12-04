import grid from './grid'
import c from '../constants'
import config from '../config'
import FieldBase from './field-base'
import Subduction from './subduction'
import Orogeny from './orogeny'
import VolcanicActivity from './volcanic-activity'
import { basicDrag, orogenicDrag } from './physics/forces'
import { serialize, deserialize } from '../utils'

// Max age of the field defines how fast the new oceanic crust cools down and goes from ridge elevation to its base elevation.
export const MAX_AGE = config.oceanicRidgeWidth / c.earthRadius
// When a continent is splitting apart along divergent boundary, its crust will get thinner and thinner
// until it reaches this value. Then the oceanic crust will be formed instead.
export const MIN_CONTINENTAL_CRUST_THICKNESS = 0.45

const FIELD_TYPE = {
  ocean: 0,
  continent: 1,
  island: 2
}
const FIELD_TYPE_NAME = Object.keys(FIELD_TYPE).reduce((res, key) => {
  res[FIELD_TYPE[key]] = key
  return res
}, {})
const ELEVATION = {
  ocean: 0.0,
  // sea level: 0.5
  continent: 0.55
}
const FIELD_AREA = c.earthArea / grid.size // in km^2
// Adjust mass of the field, so simulation works well with given force values.
const MASS_MODIFIER = 0.000005

function getMass (type) {
  return FIELD_AREA * MASS_MODIFIER * (type === 'ocean' ? config.oceanDensity : config.continentDensity)
}

export default class Field extends FieldBase {
  constructor ({ id, plate, age = 0, type = 'ocean', elevation, crustThickness }) {
    super(id, plate)
    this.alive = true
    this.boundary = false

    this.type = type
    this.age = age
    this.baseElevation = elevation !== undefined ? elevation : this.defaultElevation
    this.baseCrustThickness = crustThickness !== undefined ? crustThickness : this.defaultCrustThickness

    this.orogeny = null
    this.volcanicAct = null
    this.subduction = null

    // Used by adjacent fields only (see model.generateNewFields).
    this.noCollisionDist = 0

    // Physics properties:
    this.mass = getMass(this.type)
    this.draggingPlate = null

    // Properties that are not serialized and can be derived from other properties.
    this.isContinentBuffer = false
  }

  get serializableProps () {
    return [ 'id', 'boundary', 'age', '_type', 'baseElevation', 'baseCrustThickness', 'noCollisionDist', 'mass', 'topPlateDeform' ]
  }

  serialize () {
    const props = serialize(this)
    props.orogeny = this.orogeny && this.orogeny.serialize()
    props.subduction = this.subduction && this.subduction.serialize()
    props.volcanicAct = this.volcanicAct && this.volcanicAct.serialize()
    // Custom serialization of references to other objects.
    props.draggingPlate = this.draggingPlate ? this.draggingPlate.id : null
    return props
  }

  static deserialize (props, plate) {
    const field = new Field({ id: props.id, plate })
    deserialize(field, props)
    field.orogeny = props.orogeny && Orogeny.deserialize(props.orogeny, field)
    field.subduction = props.subduction && Subduction.deserialize(props.subduction, field)
    field.volcanicAct = props.volcanicAct && VolcanicActivity.deserialize(props.volcanicAct, field)
    // Those properties are just IDs at this point. They need to be processed later,
    // when all the objects are already created. It's done in the Model.deserialize method.
    field.draggingPlate = props.draggingPlate
    return field
  }

  clone () {
    const clone = Field.deserialize(this.serialize(), this.plate)
    clone.draggingPlate = this.draggingPlate
    return clone
  }

  set type (value) {
    this._type = FIELD_TYPE[value]
  }

  get type () {
    return FIELD_TYPE_NAME[this._type]
  }

  get isOcean () {
    return this._type === FIELD_TYPE.ocean
  }

  get isContinent () {
    return this._type === FIELD_TYPE.continent
  }

  get isIsland () {
    return this._type === FIELD_TYPE.island
  }

  get oceanicCrust () {
    return this.isOcean
  }

  get continentalCrust () {
    return this.isContinent || this.isIsland
  }

  get area () {
    return FIELD_AREA
  }

  get force () {
    const force = basicDrag(this)
    if (this.draggingPlate) {
      force.add(orogenicDrag(this, this.draggingPlate))
    }
    return force
  }

  get torque () {
    return this.absolutePos.clone().cross(this.force)
  }

  get normalizedAge () {
    return Math.min(1, this.age / MAX_AGE)
  }

  // range: [config.subductionMinElevation, 1]
  //  - [0, 1] -> [the deepest trench, the highest mountain]
  //  - 0.5 -> sea level
  //  - [config.subductionMinElevation, 0] -> subduction
  get elevation () {
    let modifier = 0
    if (this.isOcean) {
      if (this.subduction) {
        modifier = config.subductionMinElevation * this.subduction.progress
      } else if (this.normalizedAge < 1) {
        // age = 0 => oceanicRidgeElevation
        // age = 1 => baseElevation
        modifier = (config.oceanicRidgeElevation - this.baseElevation) * (1 - this.normalizedAge)
      } else if (this.topPlateDeform && this.isBoundary()) {
        modifier = -1.5
      }
    } else {
      modifier += this.mountainElevation
    }
    return Math.min(1, this.baseElevation + modifier)
  }

  get mountainElevation () {
    if (this.continentalCrust) {
      const volcano = (this.volcanicAct && this.volcanicAct.value) || 0
      const mountain = (this.orogeny && this.orogeny.maxFoldingStress) || 0
      return 0.4 * Math.max(volcano, mountain)
    }
    return 0
  }

  get crustThickness () {
    if (this.isOcean) {
      return this.baseCrustThickness * this.normalizedAge
    } else {
      return this.baseCrustThickness + this.mountainElevation * 2 // mountain roots
    }
  }

  get crustCanBeStretched () {
    return this.isContinent && this.crustThickness > MIN_CONTINENTAL_CRUST_THICKNESS
  }

  get lithosphereThickness () {
    if (this.isOcean) {
      return 0.7 * this.normalizedAge
    }
    return 0.7
  }

  get defaultElevation () {
    return ELEVATION[this.type]
  }

  get defaultCrustThickness () {
    return this.type === 'ocean' ? 0.2 : this.baseElevation
  }

  setDefaultProps () {
    this.baseElevation = this.defaultElevation
    this.baseCrustThickness = this.defaultCrustThickness
    this.orogeny = null
    this.volcanicAct = null
    this.subduction = null
    this.topPlateDeform = false
    this.mass = getMass(this.type)
  }

  displacement (timestep) {
    return this.linearVelocity.multiplyScalar(timestep)
  }

  isBoundary () {
    // At least one adjacent field of this field is an adjacent field of the whole plate.
    for (let adjId of this.adjacentFields) {
      if (this.plate.adjacentFields.has(adjId)) {
        return true
      }
    }
    return false
  }

  isAdjacentField () {
    // At least one adjacent field of this field belongs to the plate.
    for (let adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        return true
      }
    }
    return false
  }

  // Fields belonging to the parent plate.
  forEachNeighbour (callback) {
    for (let adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId)
      if (field) {
        callback(field)
      }
    }
  }

  anyNeighbour (condition) {
    for (let adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId)
      if (field && condition(field)) {
        return true
      }
    }
    return false
  }

  // One of the neighbouring fields, pointed by linear velocity vector.
  neighbourAlongVector (direction) {
    const posOfNeighbour = this.absolutePos.clone().add(direction.clone().setLength(grid.fieldDiameter))
    return this.plate.fieldAtAbsolutePos(posOfNeighbour)
  }

  // Number of adjacent fields that actually belong to the plate.
  neighboursCount () {
    let count = 0
    for (let adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        count += 1
      }
    }
    return count
  }

  get density () {
    return this.plate.density
  }

  performGeologicalProcesses (timestep) {
    if (this.subduction) {
      this.subduction.update(timestep)
      if (!this.subduction.active) {
        // Don't keep old subduction objects.
        this.subduction = null
      }
    }
    if (this.volcanicAct) {
      this.volcanicAct.update(timestep)
    }
    // Age is a travelled distance in fact.
    this.age += this.displacement(timestep).length()
  }

  resetCollisions () {
    this.draggingPlate = null
  }
}
