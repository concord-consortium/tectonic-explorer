import FieldBase from '../plates-model/field-base'

export default class FieldProxy extends FieldBase {
  constructor (idx, fieldData, plate) {
    super(fieldData.id[idx], plate)
    this.elevation = null
    this.boundary = false
    this.handleDataFromWorker(idx, fieldData)
  }

  handleDataFromWorker (idx, fieldData) {
    this.elevation = fieldData.elevation[idx]
    if (fieldData.boundary) {
      this.boundary = fieldData.boundary[idx]
    }
  }
}
