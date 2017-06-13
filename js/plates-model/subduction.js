import c from '../constants'

// We use unit sphere (radius = 1) for calculations, so scale constants.
export const MAX_SUBDUCTION_DIST = c.subductionWidth / c.earthRadius

const REVERT_SUBDUCTION_SPEED = -0.001

// Set of properties related to subduction. Used by Field instances.
export default class Subduction {
  constructor (field) {
    this.field = field
    this.dist = 0
    this.relativeSpeed = 0
    this.active = true
    this.complete = false
  }

  get progress () {
    return Math.min(1, this.dist / MAX_SUBDUCTION_DIST)
  }

  setCollision (field) {
    this.relativeSpeed = this.field.linearVelocity.distanceTo(field.linearVelocity)
  }

  resetCollision () {
    // Start opposite process. If there's still collision, it will overwrite this value again with positive speed.
    this.relativeSpeed = REVERT_SUBDUCTION_SPEED
  }

  update (timestep) {
    // Continue subduction.
    this.dist += this.relativeSpeed * timestep
    if (this.dist > MAX_SUBDUCTION_DIST) {
      this.complete = true
    }
    if (this.dist <= 0) {
      this.active = false
    }
  }
}
