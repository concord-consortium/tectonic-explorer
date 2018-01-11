import * as THREE from 'three'
import grid from '../plates-model/grid'

const RADIUS = 0.005
// Arrow points up when it's created.
const BASE_ORIENTATION = new THREE.Vector3(0, 1, 0)
const LENGTH = 1.05

function pointMarker (material) {
  const geometry = new THREE.SphereGeometry(RADIUS * 2.5, 12, 12)
  return new THREE.Mesh(geometry, material)
}

function cylinder (material) {
  const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 12)
  return new THREE.Mesh(geometry, material)
}

export default class ForceArrow {
  constructor (color) {
    this.fieldId = null

    this.material = new THREE.MeshLambertMaterial({ color })
    this.marker = pointMarker(this.material)
    this.cylinder = cylinder(this.material)
    this.localRotationRoot = new THREE.Object3D()
    this.localRotationRoot.add(this.marker)
    this.localRotationRoot.add(this.cylinder)

    this.root = new THREE.Object3D()
    this.root.add(this.localRotationRoot)

    this.cylinder.position.y = 0.5 * LENGTH
    this.cylinder.scale.y = LENGTH
    this.marker.position.y = LENGTH
  }

  dispose () {
    this.material.dispose()
    this.marker.geometry.dispose()
    this.cylinder.geometry.dispose()
  }

  setFieldId (fieldId) {
    this.fieldId = fieldId
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(BASE_ORIENTATION, grid.fields[fieldId].localPos.clone().normalize())
    this.localRotationRoot.quaternion.copy(q)
  }

  setRotation (quaternion) {
    this.root.setRotationFromQuaternion(quaternion)
  }
}
