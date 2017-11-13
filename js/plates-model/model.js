import generatePlates from './generate-plates'
import Plate from './plate'
import grid from './grid'
import config from '../config'
import markIslands from './mark-islands'
import eulerStep from './physics/euler-integrator'
import rk4Step from './physics/rk4-integrator'
import verletStep from './physics/verlet-integrator'
import { serialize, deserialize } from '../utils'

// Limit max speed of the plate, so model doesn't look crazy.
const MAX_PLATE_SPEED = 0.02

function sortByDensityAsc (plateA, plateB) {
  return plateA.density - plateB.density
}

export default class Model {
  constructor (imgData, initFunction) {
    this.time = 0
    this.stepIdx = 0
    this.plates = []
    if (imgData) {
      // It's very important to keep plates sorted, so if some new plates will be added to this list,
      // it should be sorted again.
      this.plates = generatePlates(imgData, initFunction).sort(sortByDensityAsc)
      markIslands(this.plates)
    }
  }

  get serializableProps () {
    return [ 'time', 'stepIdx' ]
  }

  serialize () {
    const props = serialize(this)
    props.plates = this.plates.map(plate => plate.serialize())
    return props
  }

  static deserialize (props) {
    const model = new Model()
    deserialize(model, props)
    model.plates = props.plates.map(serializedPlate => Plate.deserialize(serializedPlate))
    // Calculate values that are not serialized and can be derived from other properties.
    markIslands(model.plates)
    // Deserialize references to other objects. This can be done when all the plates and fields are initially created.
    model.forEachField(f => {
      if (f.draggingPlate) {
        f.draggingPlate = model.getPlate(f.draggingPlate)
      }
    })
    return model
  }

  getPlate (plateId) {
    for (let plate of this.plates) {
      if (plate.id === plateId) {
        return plate
      }
    }
    return null
  }

  forEachPlate (callback) {
    this.plates.forEach(callback)
  }

  forEachField (callback) {
    this.forEachPlate(plate => plate.forEachField(callback))
  }

  // Returns map of given plates property.
  getPlatesProp (property) {
    const result = new Map()
    this.forEachPlate(plate => {
      result.set(plate, plate[property].clone())
    })
    return result
  }

  // Updates each plate using provided map.
  setPlatesProp (property, map) {
    this.forEachPlate(plate => {
      plate[property] = map.get(plate)
    })
  }

  getQuaternions () {
    return this.getPlatesProp('quaternion')
  }

  getAngularVelocities () {
    return this.getPlatesProp('angularVelocity')
  }

  getAngularAccelerations () {
    return this.getPlatesProp('angularAcceleration')
  }

  setQuaternions (map) {
    this.setPlatesProp('quaternion', map)
  }

  setAngularVelocities (map) {
    this.setPlatesProp('angularVelocity', map)
  }

  setDensities (densities) {
    this.forEachPlate(plate => {
      plate.setDensity(densities[plate.id])
    })
    this.plates.sort(sortByDensityAsc)
  }

  get kineticEnergy () {
    // Well, not really correct, but good enough to check if model hasn't diverged.
    let ke = 0
    this.forEachPlate(plate => {
      ke += 0.5 * plate.angularSpeed * plate.angularSpeed * plate.mass
    })
    return ke
  }

  step (timestep) {
    if (this._diverged) {
      return
    }
    if (config.integration === 'euler') {
      eulerStep(this, timestep)
    } else if (config.integration === 'rk4') {
      rk4Step(this, timestep)
    } else if (config.integration === 'verlet') {
      verletStep(this, timestep)
    }
    this.time += timestep
    this.stepIdx += 1

    this.forEachPlate(plate => {
      if (plate.angularVelocity.length() > MAX_PLATE_SPEED) {
        plate.angularVelocity.setLength(MAX_PLATE_SPEED)
      }
    })

    // Detect collisions, update geological processes, add new fields and remove unnecessary ones.
    this.simulatePlatesInteractions(timestep)

    if (this.kineticEnergy > 500) {
      window.alert('Model has diverged, time: ' + this.time)
      this._diverged = true
    }
  }

  // Detect collisions, update geological processes, add new fields and remove unnecessary ones.
  simulatePlatesInteractions (timestep) {
    this.forEachField(field => field.resetCollisions())
    this.forEachPlate(plate => plate.calculateContinentBuffers())
    this.detectCollisions()
    this.forEachField(field => field.performGeologicalProcesses(timestep))
    this.forEachPlate(plate => plate.removeUnnecessaryFields()) // e.g. fields that subducted
    this.removeEmptyPlates()
    this.generateNewFields(timestep)
    // Some fields might have been added or removed, so update inertia tensor.
    this.forEachPlate(plate => plate.updateInertiaTensor())
    // Update / decrease hot spot torque value.
    this.forEachPlate(plate => plate.updateHotSpot(timestep))
  }

  detectCollisions () {
    for (let plate of this.plates) {
      // Note that plates are sorted by density (see constructor).
      plate.forEachField(field => {
        for (let otherPlate of this.plates) {
          if (plate === otherPlate) {
            continue
          }
          const otherField = otherPlate.fieldAtAbsolutePos(field.absolutePos)
          if (otherField) {
            field.collideWith(otherField)
            // Handle only one collision.
            return
          }
        }
      })
    }
  }

  removeEmptyPlates () {
    let i = 0
    while (i < this.plates.length) {
      if (this.plates[i].fields.size === 0) {
        this.plates.splice(i, 1)
      } else {
        i += 1
      }
    }
  }

  generateNewFields (timestep) {
    for (let i = 0, len = this.plates.length; i < len; i++) {
      const plate = this.plates[i]
      plate.adjacentFields.forEach(field => {
        let collision = false
        for (let j = 0; j < len; j++) {
          if (i === j) {
            continue
          }
          const otherPlate = this.plates[j]
          if (otherPlate.fieldAtAbsolutePos(field.absolutePos)) {
            collision = true
            break
          }
        }
        if (!collision) {
          field.noCollisionDist += field.displacement(timestep).length()
          // Make sure that adjacent field travelled distance at least similar to size of the single field.
          // It ensures that divergent boundaries will stay in place more or less and new crust will be building
          // only when plate is moving.
          if (field.noCollisionDist > grid.fieldDiameter * 0.9) {
            let neighboursCount = field.neighboursCount()
            // Make sure that new field has at least two existing neighbours. It prevents from creating
            // awkward, narrow shapes of the continents.
            if (neighboursCount > 1) {
              let neighbour = field.neighbourAlongVector(field.linearVelocity)
              if (!neighbour) {
                // Sometimes there will be no field along velocity vector (depends of angle between vector and boundary).
                // Use other neighbour instead. Pick one which is closest to the position of the missing field.
                const perfectPos = field.absolutePos.clone().add(field.linearVelocity.clone().setLength(grid.fieldDiameter))
                let minDist = Infinity
                field.forEachNeighbour(otherField => {
                  if (otherField.absolutePos.distanceTo(perfectPos) < minDist) {
                    neighbour = otherField
                  }
                })
              }
              const props = {}
              if (neighbour.isContinent && neighbour.crustCanBeStretched) {
                props.type = 'continent'
                props.crustThickness = neighbour.crustThickness - config.continentalStretchingRatio * grid.fieldDiameter
                props.elevation = neighbour.elevation - config.continentalStretchingRatio * grid.fieldDiameter
              } else {
                props.type = 'ocean'
              }
              plate.addFieldAlongDivBoundary(field.absolutePos, props)
            }
          }
        } else {
          field.noCollisionDist = 0
        }
      })
    }
  }

  topFieldAt (position) {
    for (let i = 0, len = this.plates.length; i < len; i++) {
      // Plates are sorted by density, start from the top one.
      const plate = this.plates[i]
      const field = plate.fieldAtAbsolutePos(position)
      if (field) {
        return field
      }
    }
    return null
  }

  setHotSpot (position, force) {
    const field = this.topFieldAt(position)
    if (field) {
      field.plate.setHotSpot(position, force)
    }
  }
}
