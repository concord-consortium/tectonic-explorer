import * as THREE from 'three'
import FieldProxy from './field-proxy'

function vec3 (v) {
  return new THREE.Vector3(v.x, v.y, v.z)
}

function quat (q) {
  return new THREE.Quaternion(q._x, q._y, q._z, q._w)
}

export default class PlateProxy {
  constructor (data) {
    this.id = data.id
    this.baseColor = data.baseColor
    this.density = data.density
    this.quaternion = new THREE.Quaternion()
    this.hotSpot = { position: new THREE.Vector3(0, 0, 0), force: new THREE.Vector3(0, 0, 0) }
    this.fields = new Map()

    this.handleDataFromWorker(data)
  }

  handleDataFromWorker (data) {
    this.quaternion = quat(data.quaternion)
    if (data.axisOfRotation) {
      this.axisOfRotation = vec3(data.axisOfRotation)
    }
    if (data.hotSpot) {
      this.hotSpot.position = vec3(data.hotSpot.position)
      this.hotSpot.force = vec3(data.hotSpot.force)
    }
    if (data.fields) {
      const fieldsData = data.fields
      fieldsData.id.forEach((id, idx) => {
        const fieldProxy = this.fields.get(id)
        if (!fieldProxy) {
          const fieldProxy = new FieldProxy(idx, fieldsData)
          this.fields.set(id, fieldProxy)
        } else {
          fieldProxy.handleDataFromWorker(idx, fieldsData)
        }
      })
    }
  }
}
