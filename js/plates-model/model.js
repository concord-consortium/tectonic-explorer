import * as THREE from 'three'
import generatePlates from './generate-plates'
import Plate from './plate'
import getGrid from './grid'
import config from '../config'
import markIslands from './mark-islands'
import fieldCollision from './fields-collision'
import addRelativeMotion from './add-relative-motion'
import dividePlate from './divide-plate'
import eulerStep from './physics/euler-integrator'
import rk4Step from './physics/rk4-integrator'
import verletStep from './physics/verlet-integrator'
import { serialize, deserialize } from '../utils'
import * as seedrandom from '../seedrandom'

// Limit max speed of the plate, so model doesn't look crazy.
const MAX_PLATE_SPEED = 0.02

function sortByDensityAsc (plateA, plateB) {
  return plateA.density - plateB.density
}

export default class Model {
  constructor (imgData, initFunction, seedrandomState) {
    if (config.deterministic && seedrandomState) {
      seedrandom.initializeFromState(seedrandomState)
    } else {
      seedrandom.initialize(config.deterministic)
    }
    this.time = 0
    this.stepIdx = 0
    this.plates = []
    if (imgData) {
      // It's very important to keep plates sorted, so if some new plates will be added to this list,
      // it should be sorted again.
      this.plates = generatePlates(imgData, initFunction).sort(sortByDensityAsc)
      markIslands(this.plates)
      this.calculateDynamicProperties(false)
    }
  }

  get serializableProps () {
    return [ 'time', 'stepIdx' ]
  }

  serialize () {
    const props = serialize(this)
    props.seedrandomState = seedrandom.getState()
    props.plates = this.plates.map(plate => plate.serialize())
    return props
  }

  static deserialize (props) {
    const model = new Model(null, null, props.seedrandomState)
    deserialize(model, props)
    model.plates = props.plates.map(serializedPlate => Plate.deserialize(serializedPlate))
    // Calculate values that are not serialized and can be derived from other properties.
    markIslands(model.plates)
    model.calculateDynamicProperties(false)
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

  get relativeMotion () {
    const sum = new THREE.Vector3()
    this.forEachPlate(plate => {
      this.forEachPlate(otherPlate => {
        if (plate.id < otherPlate.id) {
          const diff = plate.angularVelocity.clone().sub(otherPlate.angularVelocity)
          sum.add(diff)
        }
      })
    })
    return sum.length()
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

    this.calculateDynamicProperties(true)

    if (this.kineticEnergy > 500) {
      window.alert('Model has diverged, time: ' + this.time)
      this._diverged = true
    }
  }

  // Calculates properties that can be derived from other properties and don't need to be serialized.
  // Those properties also should be updated every step.
  calculateDynamicProperties (optimize) {
    this.forEachPlate(plate => plate.calculateContinentBuffers())
    this.detectCollisions(optimize)
  }

  // Detect collisions, update geological processes, add new fields and remove unnecessary ones.
  simulatePlatesInteractions (timestep) {
    this.forEachField(field => field.performGeologicalProcesses(timestep))
    this.forEachPlate(plate => plate.removeUnnecessaryFields()) // e.g. fields that subducted
    this.removeEmptyPlates()
    this.generateNewFields(timestep)
    // Some fields might have been added or removed, so update calculated physical properties.
    this.forEachPlate(plate => {
      plate.updateInertiaTensor()
      plate.updateCenter()
    })
    // Update / decrease hot spot torque value.
    this.forEachPlate(plate => plate.updateHotSpot(timestep))
    this.divideBigPlates()
    this.addRelativeMotion()
  }

  detectCollisions (optimize) {
    const fieldsPossiblyColliding = new Set()
    if (optimize) {
      // Optimization can be applied once we know which fields have collided in the previous step.
      // Only those fields and boundaries (plus their neighbours) can collide in this step.
      // There's an obvious assumption that fields won't move more than their own diameter in a single step.
      this.forEachField(field => {
        if (field.boundary || field.colliding) {
          fieldsPossiblyColliding.add(field)
          field.forEachNeighbour(neigh => fieldsPossiblyColliding.add(neigh))
        }
        field.resetCollisions()
      })
    } else {
      // No optimization - check all the fields.
      this.forEachField(field => fieldsPossiblyColliding.add(field))
    }

    fieldsPossiblyColliding.forEach(field => {
      if (field.colliding) {
        // Collision already handled
        return
      }
      // Why so strange loop? We want to find the closest colliding fields. First, we need to check plate which can
      // be directly underneath and above. Later, check plates which have bigger density difference.
      // Note that this.plates is sorted by density (ASC).
      const plateIdx = this.plates.indexOf(field.plate)
      let i = 1
      while (this.plates[plateIdx + i] || this.plates[plateIdx - i]) {
        const lowerPlate = this.plates[plateIdx + i]
        const lowerField = lowerPlate && lowerPlate.fieldAtAbsolutePos(field.absolutePos)
        if (lowerField) {
          fieldCollision(lowerField, field)
          // Handle only one collision per field (with the plate laying closest to it).
          return
        }
        const upperPlate = this.plates[plateIdx - i]
        const upperField = upperPlate && upperPlate.fieldAtAbsolutePos(field.absolutePos)
        if (upperField) {
          fieldCollision(field, upperField)
          // Handle only one collision per field (with the plate laying closest to it).
          return
        }
        i += 1
      }
    })
  }

  removeEmptyPlates () {
    let i = 0
    while (i < this.plates.length) {
      if (this.plates[i].size === 0) {
        this.plates.splice(i, 1)
      } else {
        i += 1
      }
    }
  }

  generateNewFields (timestep) {
    const grid = getGrid()
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
          field.noCollisionDist = field.noCollisionDist || 0 // noCollisionDist is undefined by default
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
              if (neighbour.crustCanBeStretched) {
                props.type = 'continent'
                props.crustThickness = neighbour.crustThickness - config.continentalStretchingRatio * grid.fieldDiameter
                props.elevation = neighbour.elevation - config.continentalStretchingRatio * grid.fieldDiameter
                props.age = neighbour.age
                // When continent is being stretched, move field marker to the new field to emphasise this effect.
                props.marked = neighbour.marked
                neighbour.marked = false
              } else {
                props.type = 'ocean'
                // `age` is a distance travelled by field. When a new field is added next to the divergent boundary,
                // it's distance from it is around half of its diameter.
                props.age = grid.fieldDiameter * 0.5
              }
              plate.addFieldAt(props, field.absolutePos)
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

  addRelativeMotion () {
    if (config.enforceRelativeMotion && this.stepIdx > 100 && this.relativeMotion < 1e-4) {
      addRelativeMotion(this.plates)
      // Shuffle plates densities to make results more interesting.
      this.plates.forEach(plate => {
        plate.density = seedrandom.random()
      })
      this.plates.sort(sortByDensityAsc)
      // Restore integer values.
      this.plates.forEach((plate, idx) => {
        plate.density = idx
      })
    }
  }

  divideBigPlates () {
    let newPlateAdded = false
    this.forEachPlate(plate => {
      if (plate.size > config.minSizeRatioForDivision * getGrid().size) {
        const newPlate = dividePlate(plate)
        if (newPlate) {
          this.plates.push(newPlate)
          newPlateAdded = true
        }
      }
    })
    if (newPlateAdded) {
      // Make sure that all the densities are unique. Plates are already sorted, so that's the easiest way.
      this.plates.sort(sortByDensityAsc)
      this.plates.forEach((plate, idx) => {
        plate.density = idx
      })
    }
  }
}
