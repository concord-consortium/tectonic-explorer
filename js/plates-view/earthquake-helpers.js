import * as THREE from 'three'

const TEXTURE_SIZE = 64

export function earthquakeTexture () {
  const size = TEXTURE_SIZE
  const strokeWidth = size * 0.06
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - strokeWidth / 2, 0, 2 * Math.PI)
  // Why is the color white? Note that in the temporal-event.js and temporal-event-fragment.glsl we set
  // custom color attribute. In the fragment shader, we multiply texture color by this custom color.
  // So, if the texture color is white, it will end up being the custom color after multiplication.
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = '#000'
  ctx.stroke()
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

export function depthToColor (depth) {
  // Depth can be negative (earthquake above the sea level) - use 0-30km range color in this case.
  if (depth <= 0.5) return 0xFF0A00
  if (depth <= 1.0) return 0xFF7A00
  if (depth <= 1.5) return 0xFFF700
  if (depth <= 2.0) return 0x56AB00
  if (depth <= 2.5) return 0x00603F
  return 0x0021BC
}

export function magnitudeToSize (magnitude) {
  return 0.004 + magnitude * 0.0012
}
