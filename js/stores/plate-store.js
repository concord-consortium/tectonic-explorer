import * as THREE from 'three'
import { observable } from 'mobx'
import PlateBase from '../plates-model/plate-base'
import FieldStore from './field-store'

export default class PlateStore extends PlateBase {
  @observable hue
  @observable density
  // Fields and their properties aren't observable, as it would be too slow. Observable properties are very slow to write
  // and read. There are thousands of fields, so it would have huge impact on performance. Instead, provide a general
  // flag that can be observed. When it's changed, the view code will trigger its render methods and read non-observable
  // properties manually.
  @observable dataUpdateID = 0

  // Properties below could be observable, but so far there's no need for that.
  id
  quaternion = new THREE.Quaternion()
  angularVelocity = new THREE.Vector3()
  center = new THREE.Vector3()
  hotSpot = { position: new THREE.Vector3(), force: new THREE.Vector3() }
  fields = new Map()

  constructor (id) {
    super()
    this.id = id
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
        let fieldStore = this.fields.get(id)
        if (!fieldStore) {
          fieldStore = new FieldStore(id, this)
          this.fields.set(id, fieldStore)
        }
        fieldStore.handleDataFromWorker(idx, fieldsData)
      })
      // Remove fields that are no longer existing in the original model.
      this.fields.forEach(field => {
        if (!fieldAlive[field.id]) {
          this.fields.delete(field.id)
        }
      })
    }
    if (data.density != null) {
      this.density = data.density
    }
    if (data.hue != null) {
      this.hue = data.hue
    }
    if (data.center != null) {
      this.center = data.center
    }
    // Update just one observable property.
    this.dataUpdateID += 1
  }
}
