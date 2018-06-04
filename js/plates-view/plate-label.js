import * as THREE from 'three'
import config from '../config'

const RADIUS = 1.025

function pointTexture (label) {
  const size = 256
  const shadowBlur = size * 0.3
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - shadowBlur, 0, 2 * Math.PI)
  ctx.fillStyle = '#aa8cc5'
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

export default class PlateLabel {
  constructor (plate) {
    this.label = pointLabel(plate.id + 1)

    this.root = new THREE.Object3D()
    this.root.add(this.label)

  }

  update (plate) {
    this.label.position.copy(plate.center).multiplyScalar(RADIUS)
  }

  dispose () {
    this.label.material.dispose()
  }
}
