import * as THREE from 'three'
import grid from './grid'
import config from '../config'
import Field from './field'
import './physics/three-extensions'

let id = 0
function getId () {
  return id++
}

function sortByDist (a, b) {
  return a.dist - b.dist
}

const HOT_SPOT_TORQUE_DECREASE = config.constantHotSpots ? 0 : 0.2

export default class Plate {
  constructor ({ color }) {
    this.id = getId()
    this.baseColor = color
    this.fields = new Map()
    this.adjacentFields = new Map()
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = this.id

    // Physics properties:
    this.angularVelocity = new THREE.Vector3(0, 0, 0)
    this.quaternion = new THREE.Quaternion() // rotation
    this.mass = 0
    this.invMomentOfInertia = new THREE.Matrix3()

    // Torque / force that is pushing plate. It might be constant or decrease with time ().
    this.hotSpot = { position: new THREE.Vector3(0, 0, 0), force: new THREE.Vector3(0, 0, 0) }
  }

  forEachField (callback) {
    this.fields.forEach(callback)
  }

  get angularSpeed () {
    return this.angularVelocity.length()
  }

  // It depends on current angular velocity and velocities of other, colliding plates.
  // Note that this is pretty expensive to calculate, so if used much, the current value should be cached.
  get angularAcceleration () {
    const totalTorque = this.hotSpot.position.clone().cross(this.hotSpot.force)
    this.fields.forEach(field => {
      totalTorque.add(field.torque)
    })
    return totalTorque.applyMatrix3(this.invMomentOfInertia)
  }

  // Euler pole.
  get axisOfRotation () {
    if (this.angularSpeed === 0) {
      // Return anything, plate is not moving anyway.
      return new THREE.Vector3(1, 0, 0)
    }
    return this.angularVelocity.clone().normalize()
  }

  updateInertiaTensor () {
    this.mass = 0
    let ixx = 0
    let iyy = 0
    let izz = 0
    let ixy = 0
    let ixz = 0
    let iyz = 0
    this.fields.forEach(field => {
      const mass = field.mass
      const p = field.absolutePos
      ixx += mass * (p.y * p.y + p.z * p.z)
      iyy += mass * (p.x * p.x + p.z * p.z)
      izz += mass * (p.x * p.x + p.y * p.y)
      ixy -= mass * p.x * p.y
      ixz -= mass * p.x * p.z
      iyz -= mass * p.y * p.z
      this.mass += mass
    })
    const momentOfInertia = new THREE.Matrix3()
    momentOfInertia.set(
      ixx, ixy, ixz,
      ixy, iyy, iyz,
      ixz, iyz, izz
    )
    this.invMomentOfInertia = new THREE.Matrix3()
    this.invMomentOfInertia.getInverse(momentOfInertia)
  }

  updateHotSpot (timestep) {
    const len = this.hotSpot.force.length()
    if (len > 0) {
      this.hotSpot.force.setLength(Math.max(0, len - timestep * HOT_SPOT_TORQUE_DECREASE))
    }
  }

  setHotSpot (position, force) {
    this.hotSpot = { position, force }
  }

  linearVelocity (absolutePos) {
    return this.angularVelocity.clone().cross(absolutePos)
  }

  // Returns absolute position of a field in cartesian coordinates (it applies plate rotation).
  absolutePosition (localPos) {
    return localPos.clone().applyQuaternion(this.quaternion)
  }

  // Returns local position.
  localPosition (absolutePos) {
    return absolutePos.clone().applyQuaternion(this.quaternion.clone().conjugate())
  }

  fieldAtAbsolutePos (absolutePos) {
    // Grid instance provides O(log n) or O(1) lookup.
    const fieldId = grid.nearestFieldId(this.localPosition(absolutePos))
    return this.fields.get(fieldId)
  }

  // Returns N nearest fields, sorted by distance from absolutePos.
  // Note that number of returned fields might be smaller than `count` argument if there's no crust at given field.
  nearestFields (absolutePos, count) {
    const data = grid.nearestFields(this.localPosition(absolutePos), count)
    return data.map(arr => {
      return { field: this.fields.get(arr[0].id), dist: arr[1] }
    }).filter(entry => {
      return !!entry.field
    }).sort(sortByDist)
  }

  removeUnnecessaryFields () {
    this.fields.forEach(f => {
      if (!f.alive) {
        this.deleteField(f.id)
      }
    })
  }

  addField (props) {
    const id = props.id
    props.plate = this
    const field = new Field(props)
    this.fields.set(id, field)
    if (this.adjacentFields.has(id)) {
      this.adjacentFields.delete(id)
    }
    field.adjacentFields.forEach(adjFieldId => {
      if (!this.fields.has(adjFieldId)) {
        this.addAdjacentField(adjFieldId)
      } else {
        const adjField = this.fields.get(adjFieldId)
        adjField.boundary = adjField.isBoundary()
      }
    })
    field.boundary = field.isBoundary()
  }

  deleteField (id) {
    const field = this.fields.get(id)
    this.fields.delete(id)
    this.addAdjacentField(id)
    field.adjacentFields.forEach(adjFieldId => {
      let adjField = this.adjacentFields.get(adjFieldId)
      if (adjField && !adjField.isAdjacentField()) {
        this.adjacentFields.delete(adjFieldId)
      }
      adjField = this.fields.get(adjFieldId)
      if (adjField) {
        adjField.boundary = true
      }
    })
  }

  addAdjacentField (id) {
    if (!this.adjacentFields.has(id)) {
      this.adjacentFields.set(id, new Field({id, plate: this}))
    }
  }

  neighboursCount (absolutePos) {
    const localPos = this.localPosition(absolutePos)
    const id = grid.nearestFieldId(localPos)
    let count = 0
    grid.fields[id].adjacentFields.forEach(adjId => {
      if (this.fields.has(adjId)) {
        count += 1
      }
    })
    return count
  }

  addFieldAlongDivBoundary (absolutePos, props) {
    const localPos = this.localPosition(absolutePos)
    let id = grid.nearestFieldId(localPos)
    if (!this.fields.has(id)) {
      props.id = id
      // `age` is a distance travelled by field. When a new field is added next to the divergent boundary,
      // it's distance from it is around half of its diameter.
      props.age = grid.fieldDiameter * 0.5
      this.addField(props)
    }
  }
}
