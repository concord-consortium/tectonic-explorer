import grid from './grid'
import PlateBase from './plate-base'

export default class Subplate extends PlateBase {
  constructor (plate) {
    super()
    this.id = plate.id + '-sub'
    this.fields = new Map()
    this.plate = plate
    this.baseColor = {h: 320, s: 1, v: 1}
    this.isSubplate = true
  }

  get density () {
    return this.plate.density + 0.01
  }

  get quaternion () {
    return this.plate.quaternion
  }

  get angularVelocity () {
    return this.plate.angularVelocity
  }

  get size () {
    return this.fields.size
  }

  addField (field) {
    const newId = grid.nearestFieldId(this.localPosition(field.absolutePos))
    if (!this.plate.fields.has(newId)) {
      return
    }
    const newField = field.clone()
    newField.id = newId
    newField.plate = this
    this.fields.set(newId, newField)
  }

  deleteField (id) {
    this.fields.delete(id)
  }
}
