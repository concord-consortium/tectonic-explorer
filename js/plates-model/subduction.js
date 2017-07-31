import * as THREE from 'three'
import c from '../constants'
import { serialize, deserialize } from '../utils'

// We use unit sphere (radius = 1) for calculations, so scale constants.
export const MAX_SUBDUCTION_DIST = c.subductionWidth / c.earthRadius
// Any direction, only it's length is important.
const REVERT_SUBDUCTION_VEL = new THREE.Vector3(-0.03, 0, 0)

const MIN_PROGRESS_TO_DETACH = 0.3
const MIN_SPEED_TO_DETACH = 0.0005
const MIN_ANGLE_TO_DETACH = Math.PI * 0.55

// Set of properties related to subduction. Used by Field instances.
export default class Subduction {
  constructor (field) {
    this.field = field
    this.dist = 0
    this.topPlate = null
    this.relativeVelocity = REVERT_SUBDUCTION_VEL
  }

  get serializableProps () {
    // There's no need to serialize .relativeVelocity and .topPlate, they're reset at the end of simulation step.
    return [ 'dist' ]
  }

  serialize () {
    return serialize(this)
  }

  static deserialize (props, field) {
    return deserialize(new Subduction(field), props)
  }

  get progress () {
    return Math.min(1, this.dist / MAX_SUBDUCTION_DIST)
  }

  get active () {
    return this.dist >= 0
  }

  get avgProgress () {
    let sum = 0
    let count = 0
    this.field.forEachNeighbour(otherField => {
      if (otherField && otherField.subduction) {
        sum += otherField.subduction.progress
        count += 1
      }
    })
    if (count > 0) {
      return sum / count
    }
    return 0
  }

  forEachSubductingNeighbour (callback) {
    this.field.forEachNeighbour(otherField => {
      if (otherField && otherField.subduction) {
        callback(otherField)
      }
    })
  }

  calcSlabGradient () {
    let count = 0
    const gradient = new THREE.Vector3()
    this.forEachSubductingNeighbour(otherField => {
      const progressDiff = otherField.subduction.avgProgress - this.avgProgress
      gradient.add(otherField.absolutePos.clone().sub(this.field.absolutePos).multiplyScalar(progressDiff))
      count += 1
    })
    if (count > 4) {
      // Require at least 5 neighbours, as otherwise gradient might not be reliable.
      return gradient.normalize()
    } else {
      return null
    }
  }

  setCollision (field) {
    this.topPlate = field.plate
    this.relativeVelocity = this.field.linearVelocity.clone().sub(field.linearVelocity)
  }

  resetCollision () {
    this.topPlate = null
    // Start opposite process. If there's still collision, it will overwrite this value again with positive speed.
    this.relativeVelocity = REVERT_SUBDUCTION_VEL
  }

  update (timestep) {
    // Continue subduction.
    this.dist += this.relativeVelocity.length() * timestep
    if (this.dist > MAX_SUBDUCTION_DIST) {
      this.field.alive = false
    }
    // This is a bit incorrect. tryToDetachFromPlate depends on neighbouring fields subduction progress.
    // It should be called after all the update() calls are made. However, it shouldn't have significant impact
    // on the simulation and simplifies code a bit.
    this.tryToDetachFromPlate()

    this.resetCollision()
  }

  tryToDetachFromPlate () {
    // It can happen when new velocity is very different from slab elevation gradient. E.g. when plate is moving
    // in the opposite direction than it used to.
    if (!this.topPlate || this.progress < MIN_PROGRESS_TO_DETACH) {
      return
    }
    const slabGradient = this.calcSlabGradient()
    if (this.relativeVelocity.length() > MIN_SPEED_TO_DETACH &&
      slabGradient && slabGradient.angleTo(this.relativeVelocity) > MIN_ANGLE_TO_DETACH) {
      this.moveToTopPlate()
      this.forEachSubductingNeighbour(otherField => {
        otherField.subduction.moveToTopPlate()
      })
    }
  }

  moveToTopPlate () {
    if (this.topPlate) {
      this.topPlate.addToSubplate(this.field)
    }
  }
}
