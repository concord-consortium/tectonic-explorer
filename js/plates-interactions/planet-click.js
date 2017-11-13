import * as THREE from 'three'

// Generic helper that detects click on the planet surface and emits an event with provided name.

export default class PlanetClick {
  constructor (getIntersection, emit, eventName, endEventName = null) {
    this.getIntersection = getIntersection
    this.emit = emit
    this.eventName = eventName
    this.endEventName = endEventName
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64))
  }

  // "active" state is when user points at target object but still hasn't pressed the mouse button.
  // This kind of state should provide some hint that interaction is possible.
  setActive () {
    document.body.style.cursor = 'crosshair'
  }

  setInactive () {
    document.body.style.cursor = 'auto'
  }

  onMouseDown () {
    const intersection = this.getIntersection(this.earthMesh)
    if (!intersection) {
      return false
    }
    this.emit(this.eventName, intersection.point)
    this.inProgress = true
    return true
  }

  onMouseMove () {
    if (!this.inProgress) {
      return
    }
    const intersection = this.getIntersection(this.earthMesh)
    if (!intersection) {
      return
    }
    this.emit(this.eventName, intersection.point)
  }

  onMouseUp () {
    if (this.inProgress && this.endEventName) {
      this.emit(this.endEventName)
    }
    this.inProgress = false
  }
}
