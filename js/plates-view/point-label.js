import * as THREE from 'three'

function pointTexture (label, labelColor, textColor) {
  const size = 256
  const shadowBlur = size * 0.3
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - shadowBlur, 0, 2 * Math.PI)
  ctx.fillStyle = 'rgb(' + labelColor.r*255 + ',' + labelColor.g*255 + ',' + labelColor.b*255 + ')'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = shadowBlur
  ctx.fill()
  // Label
  ctx.fillStyle = textColor
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

export default class PointLabel {
  constructor (label, labelColor={r: 1, g: 1, b:1}, textColor="#444") {
    const texture = pointTexture(label, labelColor, textColor)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(0.15, 0.15, 1)
    return sprite
  }
}
