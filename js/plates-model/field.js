import grid from './grid'
import c from '../constants'
import config from '../config'
import Subduction from './subduction'
import Orogeny from './orogeny'
import VolcanicActivity from './volcanic-activity'
import { basicDrag, orogenicDrag } from './physics/forces'

const defaultElevation = {
  ocean: 0.25,
  // sea level: 0.5
  continent: 0.55,
  island: 0.6
}

const FIELD_AREA = c.earthArea / grid.size // in km^2
const MASS_MODIFIER = 0.000005 // adjust mass of the field, so simulation works well with given force values

export default class Field {
  constructor ({ id, plate, age = 0, type = 'ocean', elevation = null }) {
    this.id = id
    this.plate = plate
    this.alive = true
    this.localPos = grid.fields[id].localPos
    this.adjacentFields = grid.fields[id].adjacentFields
    this.border = false

    // Age is defined between 0 and 1. 1 means that crust is "fully mature".
    // When age is smaller than 1, it means that it's a bit less dense, elevation is higher and crust thinner.
    this.age = age
    this.isOcean = type === 'ocean'
    this.baseElevation = elevation || defaultElevation[type]

    this.island = false
    this.orogeny = null
    this.volcanicAct = null
    this.subduction = null

    this.collidingFields = []
    // Used by adjacent fields only (see model.generateNewFields).
    this.noCollisionDist = 0

    // Physics properties:
    this.mass = FIELD_AREA * MASS_MODIFIER * (this.isOcean ? config.oceanDensity : config.continentDensity)
  }

  get linearVelocity () {
    return this.plate.linearVelocity(this.absolutePos)
  }

  get absolutePos () {
    return this.plate.absolutePosition(this.localPos)
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

  get isContinent () {
    return !this.isOcean
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
      } else if (this.island) {
        modifier = defaultElevation.island - this.baseElevation
      } else if (this.age < 1) {
        // age = 0 => oceanicRidgeElevation
        // age = 1 => baseElevation
        modifier = (config.oceanicRidgeElevation - this.baseElevation) * (1 - this.age)
      }
    } else {
      modifier += this.mountainElevation
    }
    return Math.min(1, this.baseElevation + modifier)
  }

  get mountainElevation () {
    if (this.isContinent) {
      const volcano = (this.volcanicAct && this.volcanicAct.value) || 0
      const mountain = (this.orogeny && this.orogeny.maxFoldingStress) || 0
      return 0.4 * Math.max(volcano, mountain)
    }
    return 0
  }

  get crustThickness () {
    if (this.isOcean) {
      return 0.2 * this.age
    } else {
      return 0.6 + this.mountainElevation * 2 // mountain roots
    }
  }

  get lithosphereThickness () {
    return 0.7 * this.age
  }

  displacement (timestep) {
    return this.linearVelocity.multiplyScalar(timestep)
  }

  isBorder () {
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
      if (this.subduction.complete) {
        // Remove field when subduction is finished.
        this.alive = false
      }
      if (!this.subduction.active) {
        // Don't keep old subduction objects.
        this.subduction = null
      }
    }
    if (this.volcanicAct) {
      this.volcanicAct.update(timestep)
    }
    this.age = Math.min(1, this.age + timestep * config.agingSpeed)
  }

  resetCollisions () {
    this.collidingFields.length = 0
    this.draggingPlate = null
    if (this.subduction) {
      this.subduction.resetCollision()
    }
    if (this.volcanicAct) {
      this.volcanicAct.resetCollision()
    }
  }

  handleCollisions () {
    this.collidingFields.forEach(field => this.collideWith(field))
  }

  collideWith (field) {
    if (this.border && field.border) {
      // Skip collision between field at border, so simulation looks a bit cleaner.
      return
    }

    if (this.isOcean && this.density < field.density) {
      if (!this.subduction) {
        this.subduction = new Subduction(this)
      }
      this.subduction.setCollision(field)
    } else if (this.density >= field.density && field.subduction) {
      if (!this.volcanicAct) {
        this.volcanicAct = new VolcanicActivity(this)
      }
      this.volcanicAct.setCollision(field)
    } else if (this.isContinent && field.isContinent) {
      this.draggingPlate = field.plate
      if (!this.orogeny) {
        this.orogeny = new Orogeny(this)
      }
      this.orogeny.setCollision(field)
    } else if ((this.isContinent && field.isOcean && this.density < field.density) ||
               (this.isOcean && field.isContinent && this.density >= field.density)) {
      // Special case when ocean "should" go over the continent. Apply drag force to stop both plates.
      this.draggingPlate = field.plate
    }
  }
}
