import * as THREE from 'three'
import grid from './grid'
import config from '../config'
import PlateBase from './plate-base'
import Subplate from './subplate'
import Field from './field'
import './physics/three-extensions'
import { serialize, deserialize } from '../utils'

let id = 0
function getId () {
  return id++
}

const HOT_SPOT_TORQUE_DECREASE = config.constantHotSpots ? 0 : 0.2

export default class Plate extends PlateBase {
  constructor ({ density, hue }) {
    super()
    this.id = getId()

    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = density
    // Base color / hue of the plate used to visually identify it.
    this.hue = hue

    this.quaternion = new THREE.Quaternion()
    this.angularVelocity = new THREE.Vector3()

    this.fields = new Map()
    this.adjacentFields = new Map()

    // Physics properties:
    this.mass = 0
    this.invMomentOfInertia = new THREE.Matrix3()

    // Torque / force that is pushing plate. It might be constant or decrease with time ().
    this.hotSpot = { position: new THREE.Vector3(0, 0, 0), force: new THREE.Vector3(0, 0, 0) }

    // Subplate is a container for some additional fields attached to this plate.
    // At this point mostly fields that were subducting under and were detached from the original plate.
    this.subplate = new Subplate(this)
  }

  get serializableProps () {
    return [ 'quaternion', 'angularVelocity', 'id', 'hue', 'density', 'mass', 'invMomentOfInertia', 'hotSpot' ]
  }

  serialize () {
    const props = serialize(this)
    props.fields = Array.from(this.fields.values()).map(field => field.serialize())
    props.adjacentFields = Array.from(this.adjacentFields.values()).map(field => field.serialize())
    props.subplate = this.subplate && this.subplate.serialize()
    return props
  }

  static deserialize (props) {
    const plate = new Plate({})
    deserialize(plate, props)
    props.fields.forEach(serializedField => {
      const field = Field.deserialize(serializedField, plate)
      plate.fields.set(field.id, field)
    })
    props.adjacentFields.forEach(serializedField => {
      const field = Field.deserialize(serializedField, plate)
      plate.adjacentFields.set(field.id, field)
    })
    plate.subplate = props.subplate && Subplate.deserialize(props.subplate, plate)
    return plate
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

  setDensity (density) {
    this.density = density
  }

  removeUnnecessaryFields () {
    this.fields.forEach(f => {
      if (!f.alive) {
        this.deleteField(f.id)
      }
    })
  }

  addField (props) {
    props.plate = this
    const field = new Field(props)
    this.addExistingField(field)
  }

  addFieldAt (props, absolutePos) {
    const localPos = this.localPosition(absolutePos)
    let id = grid.nearestFieldId(localPos)
    if (!this.fields.has(id)) {
      props.id = id
      this.addField(props)
    }
  }

  addExistingField (field) {
    const id = field.id
    field.plate = this
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
    this.subplate.deleteField(id)
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
      const newField = new Field({id, plate: this})
      if (newField.isAdjacentField()) {
        this.adjacentFields.set(id, newField)
      }
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

  calculateContinentBuffers () {
    const queue = []
    const dist = {}
    const getDist = field => {
      const id = field.id
      if (dist[id] !== undefined) return dist[id]
      return Infinity
    }

    this.forEachField(field => {
      field.isContinentBuffer = false
      if (field.isContinent) {
        field.forEachNeighbour(adjField => {
          if (adjField.isOcean && getDist(adjField) > grid.fieldDiameterInKm) {
            dist[adjField.id] = grid.fieldDiameterInKm
            queue.push(adjField)
          }
        })
      }
    })

    while (queue.length > 0) {
      const field = queue.shift()
      field.isContinentBuffer = true
      const newDist = getDist(field) + grid.fieldDiameterInKm
      if (newDist < config.continentBufferWidth) {
        field.forEachNeighbour(adjField => {
          if (adjField.isOcean && getDist(adjField) > newDist) {
            dist[adjField.id] = newDist
            queue.push(adjField)
          }
        })
      }
    }
  }

  mergeIsland (island, collidingField) {
    const perfectPosition = island.absolutePos
    let bestFieldId = null
    let minDist = Infinity

    for (let adjId of collidingField.adjacentFields) {
      const adjField = this.adjacentFields.get(adjId)
      if (adjField) {
        const dist = adjField.absolutePos.distanceTo(perfectPosition)
        // neighboursCount() > 1 check is here to make sure that islands are not collected in some kind of narrow spike.
        if (dist < minDist && adjField.neighboursCount() > 1) {
          bestFieldId = adjField.id
          minDist = dist
        }
      }
    }

    if (bestFieldId) {
      // Sometimes island can be placed at the boundary and become a trench. Make sure that trench elevation modifier
      // is not applied to the new field.
      island.trench = false
      this.addField({
        id: bestFieldId,
        age: island.age,
        type: 'continent',
        elevation: island.elevation,
        crustThickness: island.baseCrustThickness,
        originalHue: island.plate.hue,
        marked: island.marked
      })
    }

    // Remove the old island field.
    island.alive = false
    island.marked = false
  }

  addToSubplate (field) {
    field.alive = false
    this.subplate.addField(field)
  }

  // Returns fields adjacent to the whole plate which will be probably added to it soon (around divergent boundaries).
  getVisibleAdjacentFields () {
    const result = []
    this.adjacentFields.forEach(field => {
      if (field.noCollisionDist > 0) {
        result.push(field)
      }
    })
    return result
  }
}
