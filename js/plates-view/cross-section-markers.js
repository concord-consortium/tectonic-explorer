import * as THREE from 'three'
import CylinderArc from './cylinder-arc'

const ARC_SEGMENTS = 16
const ARC_WIDTH = 0.01

const RADIUS = 1.01

function pointTexture (label) {
  const size = 256
  const shadowBlur = size * 0.3
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - shadowBlur, 0, 2 * Math.PI)
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = shadowBlur
  ctx.fill()
  // Label
  ctx.fillStyle = '#444'
  ctx.shadowBlur = 0
  ctx.shadowColor = 'rgba(0,0,0,0)'
  ctx.font = `${size * 0.25}px museo-sans, verdana, arial, helvetica, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, size / 2, size / 2)
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

function pointLabel (label) {
  const texture = pointTexture(label)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(0.15, 0.15, 1)
  return sprite
}

export default class CrossSectionMarkers {
  constructor () {
    this.label1 = pointLabel('P1')
    this.label2 = pointLabel('P2')
    this.cylinder = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
    this.cylinder.root.scale.set(RADIUS, RADIUS, RADIUS)

    this.root = new THREE.Object3D()
    this.root.add(this.cylinder.root)
    this.root.add(this.label1)
    this.root.add(this.label2)
  }

  update (point1, point2) {
    if (point1 && point2) {
      this.label1.position.copy(point1).multiplyScalar(RADIUS + 0.015)
      this.label2.position.copy(point2).multiplyScalar(RADIUS + 0.015)
      this.cylinder.update(point1, point2)
      this.root.visible = true
    } else {
      this.root.visible = false
    }
  }
}
