export default class FieldProxy {
  constructor (idx, fieldData) {
    this.id = fieldData.id[idx]
    this.elevation = null
    this.handleDataFromWorker(idx, fieldData)
  }

  handleDataFromWorker (idx, fieldData) {
    this.elevation = fieldData.elevation[idx]
  }
}
