import * as THREE from 'three'
import grid from '../plates-model/grid'

const WIDTH = 0.008
const NULL_POS = {x: 0, y: 0, z: 0}
const MIN_LENGTH = 0.0001
const LEN_SCALE = 1.5

export default class VectorField {
  constructor (fields, property, color = 0xffffff, countDivider = 1) {
    this.fields = fields
    this.property = property
    this.countDivider = countDivider
    this.arrowsCount = Math.ceil(grid.size / countDivider)

    this.geometry = new THREE.BufferGeometry()
    // * 3 * 3 => 3 vertices per arrow (triangle), each vertex has 3 coordinates (x, y, z).
    const positions = new Float32Array(this.arrowsCount * 3 * 3)
    this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.attributes.position.dynamic = true

    this.positionAttr = this.geometry.attributes.position
    this.geometry.computeBoundingSphere()

    this.material = new THREE.MeshBasicMaterial({color, opacity: 0.6, transparent: true})
    this.root = new THREE.Mesh(this.geometry, this.material)
  }

  set visible (v) {
    this.root.visible = v
  }

  dispose () {
    this.geometry.dispose()
    this.material.dispose()
  }

  setPos (i, vector) {
    const pos = this.positionAttr.array
    const idx = i * 3
    pos[idx] = vector.x
    pos[idx + 1] = vector.y
    pos[idx + 2] = vector.z
  }

  update () {
    const fields = this.fields
    for (let i = 0; i < this.arrowsCount; i += 1) {
      const vi = i * 3
      const field = fields.get(i * this.countDivider)
      const vector = field && field[this.property] && field[this.property].clone()
      const length = vector && vector.length()
      if (length && length > MIN_LENGTH) {
        vector.setLength(length * LEN_SCALE)
        const pos = field.absolutePos
        const sideOffset = vector.clone().cross(pos).setLength(WIDTH)
        this.setPos(vi, pos.clone().add(sideOffset))
        this.setPos(vi + 1, pos.clone().add(vector))
        this.setPos(vi + 2, pos.clone().sub(sideOffset))
      } else {
        this.setPos(vi, NULL_POS)
        this.setPos(vi + 1, NULL_POS)
        this.setPos(vi + 2, NULL_POS)
      }
    }
    this.positionAttr.needsUpdate = true
  }
}
