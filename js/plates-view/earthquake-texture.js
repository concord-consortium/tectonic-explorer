import * as THREE from 'three'

const TEXTURE_SIZE = 64

export default function earthquakeTexture ({ alphaOnly = false }) {
  const size = TEXTURE_SIZE
  const strokeWidth = size * 0.06
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (alphaOnly) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)
  }
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - strokeWidth / 2, 0, 2 * Math.PI)
  ctx.fillStyle = alphaOnly ? '#fff' : '#f00'
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = alphaOnly ? '#fff' : '#000'
  ctx.stroke()
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}
