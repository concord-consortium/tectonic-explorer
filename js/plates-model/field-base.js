import grid from './grid'

// Common functionality used by Field and FieldProxy.
export default class FieldBase {
  constructor (id, plate) {
    this.id = id
    this.plate = plate
    this.localPos = grid.fields[id].localPos
  }

  get linearVelocity () {
    return this.plate.linearVelocity(this.absolutePos)
  }

  get absolutePos () {
    return this.plate.absolutePosition(this.localPos)
  }
}
