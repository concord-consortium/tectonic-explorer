import * as THREE from 'three'
import c from '../constants'
import config from '../config'

export default class CrossSectionDrawing {
  constructor (getIntersection, emit) {
    this.getIntersection = getIntersection
    this.emit = emit
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    const geometry = new THREE.SphereGeometry(1.0, 64, 64)
    this.earthMesh = new THREE.Mesh(geometry)
    this.screenWidth = Infinity
    this.data = null
  }

  setScreenWidth (width) {
    this.screenWidth = width
  }

  get maxLineWidth () {
    return Math.min(config.maxCrossSectionLength, this.screenWidth / config.crossSectionPxPerKm)
  }

  checkMaxLength (data) {
    const { point1, point2 } = data
    const length = point1.angleTo(point2) * c.earthRadius
    if (length > this.maxLineWidth) {
      const rotation = new THREE.Quaternion()
      rotation.setFromUnitVectors(point1, point2)
      const allowedRotation = new THREE.Quaternion()
      allowedRotation.slerp(rotation, this.maxLineWidth / length)
      data.point2 = point1.clone().applyQuaternion(allowedRotation)
    }
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
    this.data = null
    const intersection = this.getIntersection(this.earthMesh)
    if (!intersection) {
      return false
    }
    this.data = {
      point1: intersection.point
    }
    return true
  }

  onMouseMove () {
    if (!this.data) {
      return
    }
    const intersection = this.getIntersection(this.earthMesh)
    if (!intersection) {
      return
    }
    this.data.point2 = intersection.point
    this.checkMaxLength(this.data)
    this.emit('crossSectionDrawing', this.data)
  }

  onMouseUp () {
    if (this.data) {
      this.emit('crossSectionDrawingEnd', this.data)
    }
    this.data = null
  }
}
