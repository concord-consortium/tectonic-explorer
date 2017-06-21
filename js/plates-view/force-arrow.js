import * as THREE from 'three'

const RADIUS = 0.01
// Arrow points up when it's created.
const BASE_ORIENTATION = new THREE.Vector3(0, 1, 0)
const LENGTH_RATIO = 0.1
const MIN_LENGTH = 0.01

function pointMarker () {
  const material = new THREE.MeshLambertMaterial({color: 0xff0000})
  const geometry = new THREE.SphereGeometry(RADIUS * 1.3, 12, 12)
  return new THREE.Mesh(geometry, material)
}

function cylinder () {
  const material = new THREE.MeshLambertMaterial({color: 0xff0000})
  const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 12)
  return new THREE.Mesh(geometry, material)
}

function arrowHead () {
  const material = new THREE.MeshLambertMaterial({color: 0xff0000})
  const geometry = new THREE.CylinderGeometry(0, RADIUS * 2, 0.05, 12)
  return new THREE.Mesh(geometry, material)
}

export default class ForceArrow {
  constructor () {
    this.marker = pointMarker()
    this.cylinder = cylinder()
    this.arrowHead = arrowHead()
    this.root = new THREE.Object3D()
    this.root.add(this.marker)
    this.root.add(this.cylinder)
    this.root.add(this.arrowHead)
  }

  setLength (len) {
    this.cylinder.position.y = 0.5 * len
    this.cylinder.scale.y = len
    this.arrowHead.position.y = len
  }

  update (position, force) {
    const newLen = force.length() * LENGTH_RATIO
    if (newLen < MIN_LENGTH) {
      this.root.visible = false
      return
    }
    this.root.visible = true
    this.root.position.copy(position)
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(BASE_ORIENTATION, force.clone().normalize())
    this.root.quaternion.copy(q)
    this.setLength(force.length() * LENGTH_RATIO)
  }
}
