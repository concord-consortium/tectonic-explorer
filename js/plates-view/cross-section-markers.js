import * as THREE from 'three'
import CylinderArc from './cylinder-arc'
import config from '../config'

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
  ctx.font = `${size * 0.25}px verdana, arial, helvetica, sans-serif`
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
    this.cylinder1 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
    this.cylinder1.root.scale.set(RADIUS, RADIUS, RADIUS)

    this.root = new THREE.Object3D()
    this.root.add(this.cylinder1.root)
    this.root.add(this.label1)
    this.root.add(this.label2)

    if (config.crossSection3d) {
      this.label3 = pointLabel('P3')
      this.label4 = pointLabel('P4')
      this.cylinder2 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
      this.cylinder2.root.scale.set(RADIUS, RADIUS, RADIUS)
      this.cylinder3 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
      this.cylinder3.root.scale.set(RADIUS, RADIUS, RADIUS)
      this.cylinder4 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH)
      this.cylinder4.root.scale.set(RADIUS, RADIUS, RADIUS)

      this.root.add(this.cylinder2.root)
      this.root.add(this.cylinder3.root)
      this.root.add(this.cylinder4.root)
      this.root.add(this.label3)
      this.root.add(this.label4)
    }
  }

  update (point1, point2, point3, point4) {
    const labelRadius = RADIUS + 0.015
    if (point1 && point2) {
      this.label1.position.copy(point1).multiplyScalar(labelRadius)
      this.label2.position.copy(point2).multiplyScalar(labelRadius)
      this.cylinder1.update(point1, point2)
      this.root.visible = true

      if (config.crossSection3d) {
        this.label3.position.copy(point3).multiplyScalar(labelRadius)
        this.label4.position.copy(point4).multiplyScalar(labelRadius)
        this.cylinder2.update(point2, point3)
        this.cylinder3.update(point3, point4)
        this.cylinder4.update(point4, point1)
      }
    } else {
      this.root.visible = false
    }
  }
}
