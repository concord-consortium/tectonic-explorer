import * as THREE from 'three'
import CylinderArc from './cylinder-arc'

const ARC_SEGMENTS = 6
const ARC_WIDTH = 0.01
const MARKER_RADIUS = 0.025

const RADIUS = 1.03

function pointMarker () {
  const material = new THREE.MeshLambertMaterial({color: 0xffffff})
  const geometry = new THREE.SphereGeometry(MARKER_RADIUS, 12, 12)
  return new THREE.Mesh(geometry, material)
}

export default class CrossSectionMarkers {
  constructor () {
    this.marker1 = pointMarker()
    this.marker2 = pointMarker()
    this.cylinder = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
    this.cylinder.root.scale.set(RADIUS, RADIUS, RADIUS)

    this.root = new THREE.Object3D()
    this.root.add(this.marker1)
    this.root.add(this.marker2)
    this.root.add(this.cylinder.root)
  }

  update (newState) {
    const { point1, point2 } = newState
    if (point1 && point2) {
      this.marker1.position.copy(point1).multiplyScalar(RADIUS - 0.02)
      this.marker2.position.copy(point2).multiplyScalar(RADIUS - 0.02)
      this.cylinder.update(point1, point2)
      this.marker1.visible = true
      this.marker2.visible = true
      this.cylinder.visible = true
    } else {
      this.marker1.visible = false
      this.marker2.visible = false
      this.cylinder.visible = false
    }
  }
}
