import * as THREE from 'three'
import FieldBase from '../plates-model/field-base'

export default class FieldProxy extends FieldBase {
  constructor (idx, fieldData, plate) {
    super(fieldData.id[idx], plate)
    this.elevation = null
    this.boundary = false
    this.force = new THREE.Vector3()
    this.handleDataFromWorker(idx, fieldData)
  }

  handleDataFromWorker (idx, fieldData) {
    this.elevation = fieldData.elevation[idx]
    if (fieldData.boundary) {
      this.boundary = fieldData.boundary[idx]
    }
    if (fieldData.forceX) {
      this.force.set(fieldData.forceX[idx], fieldData.forceY[idx], fieldData.forceZ[idx])
    }
  }
}
