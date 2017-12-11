import * as THREE from 'three'
import FieldBase from '../plates-model/field-base'
import { floatToHsv } from '../utils'

export default class FieldProxy extends FieldBase {
  constructor (idx, fieldData, plate) {
    super(fieldData.id[idx], plate)
    this.elevation = null
    this.boundary = false
    this.force = new THREE.Vector3()
    this.originalColor = null
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
    if (fieldData.originalColor && fieldData.originalColor[idx]) {
      // Color is encoded in one float.
      this.originalColor = floatToHsv(fieldData.originalColor[idx])
    }
  }
}
