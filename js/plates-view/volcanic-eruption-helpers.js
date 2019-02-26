import * as THREE from 'three'

const TEXTURE_SIZE = 64

export function drawVolcanicEruptionShape (ctx, x, y, size) {
  // Triangle.
  ctx.beginPath()
  ctx.moveTo(x - size * 0.5, y)
  ctx.lineTo(x, y - size)
  ctx.lineTo(x + size * 0.5, y)
  ctx.lineTo(x - size * 0.5, y)
  ctx.fillStyle = '#FF7A00'
  ctx.fill()
  ctx.lineWidth = size * 0.06
  ctx.strokeStyle = '#000'
  ctx.stroke()
}

export function volcanicEruptionTexture () {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  drawVolcanicEruptionShape(ctx, TEXTURE_SIZE * 0.5, TEXTURE_SIZE, TEXTURE_SIZE)
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}
