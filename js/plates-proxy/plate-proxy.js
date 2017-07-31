import * as THREE from 'three'
import PlateBase from '../plates-model/plate-base'
import FieldProxy from './field-proxy'

export default class PlateProxy extends PlateBase {
  constructor (data) {
    super()
    this.id = data.id
    this.quaternion = new THREE.Quaternion()
    this.angularVelocity = new THREE.Vector3()
    this.baseColor = data.baseColor
    this.density = data.density
    this.hotSpot = { position: new THREE.Vector3(), force: new THREE.Vector3() }
    this.fields = new Map()

    this.handleDataFromWorker(data)
  }

  handleDataFromWorker (data) {
    // THREE.Quaternion is serialized to {_x: ..., _y: ..., _z: ..., _w: ...} format.
    this.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w)
    this.angularVelocity.set(data.angularVelocity.x, data.angularVelocity.y, data.angularVelocity.z)
    if (data.hotSpot) {
      this.hotSpot.position.copy(data.hotSpot.position)
      this.hotSpot.force.copy(data.hotSpot.force)
    }
    if (data.fields) {
      const fieldsData = data.fields
      const fieldAlive = {}
      fieldsData.id.forEach((id, idx) => {
        fieldAlive[id] = true
        const fieldProxy = this.fields.get(id)
        if (!fieldProxy) {
          const fieldProxy = new FieldProxy(idx, fieldsData, this)
          this.fields.set(id, fieldProxy)
        } else {
          fieldProxy.handleDataFromWorker(idx, fieldsData)
        }
      })
      // Remove fields that are no longer existing in the original model.
      this.fields.forEach(field => {
        if (!fieldAlive[field.id]) {
          this.fields.delete(field.id)
        }
      })
    }
  }
}
