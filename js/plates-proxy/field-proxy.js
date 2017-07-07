export default class FieldProxy {
  constructor (idx, fieldData) {
    this.id = fieldData.id[idx]
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
