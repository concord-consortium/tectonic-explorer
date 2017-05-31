import * as THREE from 'three'
import c from '../constants'
import config from '../config'

export default class CrossSectionDrawing {
  constructor (getIntersection, emit) {
    this.getIntersection = getIntersection
    this.emit = emit
    this.state = {}
    this.active = false
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    const geometry = new THREE.SphereGeometry(1.0, 64, 64)
    this.earthMesh = new THREE.Mesh(geometry)
  }

  setState (newState) {
    this.state = Object.assign(this.state, newState)
    this.checkMaxLength()
    this.emit('crossSection', this.state)
  }

  checkMaxLength () {
    const { point1, point2 } = this.state
    const length = point1.angleTo(point2) * c.earthRadius
    if (length > config.maxCrossSectionLength) {
      const rotation = new THREE.Quaternion()
      rotation.setFromUnitVectors(point1, point2)
      const allowedRotation = new THREE.Quaternion()
      allowedRotation.slerp(rotation, config.maxCrossSectionLength / length)
      this.state.point2 = point1.clone().applyQuaternion(allowedRotation)
    }
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
    this.setState({
      point1: intersection.point,
      point2: intersection.point,
      finished: false
    })
  }

  onMouseMove () {
    const intersection = this.getIntersection(this.earthMesh)
    if (intersection) {
      this.setState({
        point2: intersection.point
      })
    }
  }

  onMouseUp () {
    this.setState({
      finished: true
    })
  }
}
