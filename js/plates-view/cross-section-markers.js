import * as THREE from 'three'

function pointMarker () {
  const geometry = new THREE.SphereGeometry(0.02, 12, 12)
  const material = new THREE.MeshBasicMaterial({color: 0xffffff})
  return new THREE.Mesh(geometry, material)
}

export default class CrossSectionMarkers {
  constructor () {
    this.marker1 = pointMarker()
    this.marker2 = pointMarker()

    this.root = new THREE.Object3D()
    this.root.add(this.marker1)
    this.root.add(this.marker2)
  }

  update (newState) {
    const { point1, point2 } = newState
    if (point1 && point2) {
      this.marker1.position.copy(point1)
      this.marker2.position.copy(point2)
    } else {
      this.marker1.visible = false
      this.marker2.visible = false
    }
  }
}
