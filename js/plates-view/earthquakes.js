import * as THREE from 'three'

// Generated using:
// http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm
function easeOutBounce (t) {
  let ts = t * t
  let tc = ts * t
  return 33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t
}

function getEarthquakeTexture () {
  const size = 128
  const strokeWidth = size * 0.06
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - strokeWidth / 2, 0, 2 * Math.PI)
  ctx.fillStyle = '#f00'
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = '#000'
  ctx.stroke()
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

function getEarthquakeAlpha () {
  const size = 128
  const strokeWidth = size * 0.06
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - strokeWidth / 2, 0, 2 * Math.PI)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = '#fff'
  ctx.stroke()
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

function generateUVs (count) {
  // * 2 * 3 * 2 =>  2 * 3 vertices per earthquake (2 triangles to form a rectangle),
  // each uv 2 coordinates (u, v)
  const uvs = new Float32Array(count * 2 * 3 * 2)
  const set = (i, u, v) => {
    const idx = i * 2
    uvs[idx] = u
    uvs[idx + 1] = v
  }
  for (let i = 0; i < count; i += 1) {
    const vi = i * 6
    // triangle 1
    set(vi, 1, 1)
    set(vi + 1, 0, 1)
    set(vi + 2, 0, 0)
    // triangle 2
    set(vi + 3, 0, 0)
    set(vi + 4, 1, 0)
    set(vi + 5, 1, 1)
  }
  return uvs
}

const TRANSITION_TIME = 750
const SIZE = 0.01
const NULL_POS = { x: 0, y: 0, z: 0 }

export default class Earthquakes {
  constructor (color = 0xff0000, count, texture = getEarthquakeTexture(), alphaMap = getEarthquakeAlpha()) {
    this.count = count
    this.geometry = new THREE.BufferGeometry()
    // * 3 * 3 * 2 =>  2 * 3 vertices per earthquake (2 triangles to form a rectangle),
    // each vertex has 3 coordinates (x, y, z).
    const positions = new Float32Array(count * 3 * 3 * 2)
    this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.attributes.position.dynamic = true

    const uvs = generateUVs(count)
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2))

    this.positionAttr = this.geometry.attributes.position
    this.geometry.computeBoundingSphere()

    this.material = new THREE.MeshBasicMaterial({ map: texture, alphaMap, transparent: true })
    this.root = new THREE.Mesh(this.geometry, this.material)

    this.position = []
    this.targetVisibility = new Float32Array(count)
    this.currentVisibility = new Float32Array(count)
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

  hide (idx) {
    const vi = idx * 6
    // triangle 1
    this.setPos(vi, NULL_POS)
    this.setPos(vi + 1, NULL_POS)
    this.setPos(vi + 2, NULL_POS)
    // triangle 2
    this.setPos(vi + 3, NULL_POS)
    this.setPos(vi + 4, NULL_POS)
    this.setPos(vi + 5, NULL_POS)
    this.positionAttr.needsUpdate = true
  }

  setVisible (idx, visible, pos) {
    this.targetVisibility[idx] = visible ? 1 : 0
    this.position[idx] = pos
  }

  setSize (idx, size) {
    const vi = idx * 6
    const pos = this.position[idx]
    // Cross product with any random, non-parallel vector will result in a perpendicular vector.
    const randVec = pos.clone()
    randVec.y += 0.1
    const prependVec1 = pos.clone().cross(randVec)
    // Cross product of two vectors will result in a vector perpendicular to both.
    const prependVec2 = prependVec1.clone().cross(pos)
    prependVec1.setLength(size)
    prependVec2.setLength(size)
    // Generate square.
    const p1 = pos.clone().add(prependVec1).add(prependVec2)
    const p2 = pos.clone().add(prependVec1).sub(prependVec2)
    const p3 = pos.clone().sub(prependVec1).sub(prependVec2)
    const p4 = pos.clone().sub(prependVec1).add(prependVec2)
    // triangle 1
    this.setPos(vi, p1)
    this.setPos(vi + 1, p2)
    this.setPos(vi + 2, p3)
    // triangle 3
    this.setPos(vi + 3, p3)
    this.setPos(vi + 4, p4)
    this.setPos(vi + 5, p1)
    this.positionAttr.needsUpdate = true
  }

  updateTransitions (progress) {
    progress /= TRANSITION_TIME // map to [0, 1]
    for (let i = 0; i < this.count; i += 1) {
      if (this.currentVisibility[i] !== this.targetVisibility[i]) {
        this.currentVisibility[i] += this.currentVisibility[i] < this.targetVisibility[i] ? progress : -progress
        this.currentVisibility[i] = Math.max(0, Math.min(1, this.currentVisibility[i]))
        const size = easeOutBounce(this.currentVisibility[i]) * SIZE
        if (size === 0) {
          this.hide(i)
        } else {
          this.setSize(i, size)
        }
      }
    }
  }
}
