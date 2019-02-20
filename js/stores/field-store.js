import * as THREE from 'three'
import FieldBase from '../plates-model/field-base'

export default class FieldStore extends FieldBase {
  // Never ever use @observable decorator here. There are too many fields being used and simple setting of a property
  // value will take too much time (it's been tested).
  elevation = null
  normalizedAge = null
  boundary = false
  earthquake = false
  force = new THREE.Vector3()
  originalHue = null

  handleDataFromWorker (idx, fieldData) {
    this.elevation = fieldData.elevation[idx]
    this.normalizedAge = fieldData.normalizedAge[idx]
    if (fieldData.boundary) {
      this.boundary = fieldData.boundary[idx]
    }
    if (fieldData.earthquake) {
      this.earthquake = fieldData.earthquake[idx]
    }
    if (fieldData.forceX) {
      this.force.set(fieldData.forceX[idx], fieldData.forceY[idx], fieldData.forceZ[idx])
    }
    if (fieldData.originalHue) {
      this.originalHue = fieldData.originalHue[idx] !== -1 ? fieldData.originalHue[idx] : null
    }
  }
}
