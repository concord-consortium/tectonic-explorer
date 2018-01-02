import grid from './grid'

// Common functionality used by Field and FieldStore.
export default class FieldBase {
  constructor (id, plate) {
    this._id = id
    this.plate = plate
    this.localPos = grid.fields[id].localPos
    this.adjacentFields = grid.fields[id].adjacentFields
  }

  set id (newId) {
    this._id = newId
    this.localPos = grid.fields[newId].localPos
    this.adjacentFields = grid.fields[newId].adjacentFields
  }

  get id () {
    return this._id
  }

  get linearVelocity () {
    return this.plate.linearVelocity(this.absolutePos)
  }

  get absolutePos () {
    return this.plate.absolutePosition(this.localPos)
  }
}
