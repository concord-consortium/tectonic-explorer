import * as THREE from 'three'
import { LENGTH_RATIO } from '../plates-view/force-arrow'

// THREE.PlaneGeometry default orientation.
const DEFAULT_PLANE_ORIENTATION = new THREE.Vector3(0, 0, 1)
const MAX_FORCE_LEN = 3

export default class ForceDrawing {
  constructor (getIntersection, emit) {
    this.getIntersection = getIntersection
    this.emit = emit
    this.state = {}
    this.active = false
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64))
    // Test geometry for a second point. This plane will be set, so perpendicular to Earth surface and vector
    // going from Earth center to the first point.
    this.planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100))
  }

  setState (newState) {
    this.state = Object.assign(this.state, newState)
    this.checkMaxLength()
    this.emit('force', this.state)
  }

  checkMaxLength () {
    if (this.state.force.length() > MAX_FORCE_LEN) {
      this.state.force.setLength(MAX_FORCE_LEN)
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
    // Rotate and move plane, so it's perpendicular to vector going from the center of the Earth to the
    // base of the force arrow.
    this.planeMesh.quaternion.setFromUnitVectors(DEFAULT_PLANE_ORIENTATION, intersection.point)
    this.planeMesh.position.copy(intersection.point)
    // Update matrices. Usually it's done automatically by THREE.js when object is being rendered,
    // but this mesh is never being rendered. It's used only to calculate intersection.
    this.planeMesh.updateMatrix()
    this.planeMesh.updateMatrixWorld()
    this.setState({
      position: intersection.point,
      force: new THREE.Vector3(0, 0, 0)
    })
  }

  onMouseMove () {
    const intersection = this.getIntersection(this.planeMesh)
    if (intersection) {
      this.setState({
        force: intersection.point.clone().sub(this.state.position).multiplyScalar(1 / LENGTH_RATIO)
      })
    }
  }

  onMouseUp () {
    // Nothing to do
  }
}
