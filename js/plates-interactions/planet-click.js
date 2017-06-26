import * as THREE from 'three'

// Generic helper that detects click on the planet surface and emits an event with provided name.

export default class PlanetClick {
  constructor (getIntersection, emit, eventName) {
    this.getIntersection = getIntersection
    this.emit = emit
    this.eventName = eventName
    this.active = false
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64))
  }

  test () {
    return this.getIntersection(this.earthMesh)
  }

  // "active" state is when user points at target object but still hasn't pressed the mouse button.
  // This kind of state should provide some hint that interaction is possible.
  setActive () {
    document.body.style.cursor = 'crosshair'
    this.active = true
  }

  setInactive () {
    document.body.style.cursor = 'auto'
    this.active = false
  }

  onMouseDown () {
    const intersection = this.getIntersection(this.earthMesh)
    this.emit(this.eventName, intersection.point)
  }
}
