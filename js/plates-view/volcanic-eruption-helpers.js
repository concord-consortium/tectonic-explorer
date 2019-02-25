import * as THREE from 'three'

const TEXTURE_SIZE = 64

export function volcanicEruptionTexture () {
  const size = TEXTURE_SIZE
  const strokeWidth = size * 0.06
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  // Equilateral triangle.
  ctx.moveTo(0.5 * size, 0)
  ctx.lineTo(0, size * 0.866)
  ctx.lineTo(size, size * 0.866)
  ctx.lineTo(0.5 * size, 0)

  ctx.fillStyle = '#fff'
  ctx.fill()

  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = '#000'
  ctx.stroke()
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}
