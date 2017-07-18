import * as THREE from 'three'
import vertexShader from './plate-mesh-vertex.glsl'
import fragmentShader from './plate-mesh-fragment.glsl'
import VectorField from './vector-field'
import ForceArrow from './force-arrow'
import { hsvToRgb, rgbToHex, topoColor } from '../colormaps'
import config from '../config'
import grid from '../plates-model/grid'

const MIN_SPEED_TO_RENDER_POLE = 0.002

const TRANSPARENT = {r: 0, g: 0, b: 0, a: 0}
const COLLISION_COLOR = {r: 1, g: 1, b: 0.1, a: 1}
const SUBDUCTION_COLOR = {r: 0.2, g: 0.2, b: 0.5, a: 1}
const BOUNDARY_COLOR = {r: 0.8, g: 0.2, b: 0.5, a: 1}

function equalColors (c1, c2) {
  return c1 && c2 && c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a
}

function getMaterial () {
  // Easiest way to modify THREE built-in material:
  const material = new THREE.MeshPhongMaterial({
    type: 'MeshPhongMaterialWithAlphaChannel',
    transparent: true
  })
  material.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms)
  material.vertexShader = vertexShader
  material.fragmentShader = fragmentShader
  material.alphaTest = 0.2
  if (config.bumpMapping) {
    const mapHeight = new THREE.TextureLoader().load('data/mountains.png')
    mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping
    mapHeight.repeat.set(7, 7)
    material.bumpMap = mapHeight
    material.bumpScale = 0.1
  }
  return material
}

function axisOfRotation (color) {
  const geometry = new THREE.CylinderGeometry(0.01, 0.01, 2.2)
  const material = new THREE.MeshPhongMaterial({ color })
  return new THREE.Mesh(geometry, material)
}

const SHARED_MATERIAL = getMaterial()

export default class PlateMesh {
  constructor (plate, props) {
    this.plate = plate
    this.baseColor = hsvToRgb(this.plate.baseColor, 0)

    this.basicMesh = this.basicPlateMesh()
    this.colorAttr = this.basicMesh.geometry.attributes.color
    this.vertexBumpScaleAttr = this.basicMesh.geometry.attributes.vertexBumpScale

    this.currentColor = {}

    this.root = new THREE.Object3D()
    // Reflect density and subduction order in rendering.
    const scale = 1 + this.plate.density / 1000
    this.root.scale.set(scale, scale, scale)

    this.root.add(this.basicMesh)

    // Color used by various arrows and shapes related to plate (e.g. Euler pole or force arrow).
    this.helpersColor = rgbToHex(hsvToRgb(this.plate.baseColor, 1.0))

    this.axis = axisOfRotation(this.helpersColor)
    this.root.add(this.axis)

    this.velocities = new VectorField(plate.fields, 'linearVelocity', 0xffffff, 3)
    this.root.add(this.velocities.root)

    // Per-field forces calculated by physics engine, mostly related to drag and orogeny.
    this.forces = new VectorField(plate.fields, 'force', 0xff0000, 1)
    this.root.add(this.forces.root)

    // User-defined force that drives motion of the plate.
    this.forceArrow = new ForceArrow(this.helpersColor)
    this.root.add(this.forceArrow.root)

    this.props = {}
    this.setProps(props)

    this.update(plate)
  }

  dispose () {
    this.geometry.dispose()
    this.axis.geometry.dispose()
    this.axis.material.dispose()
    this.velocities.dispose()
    this.forces.dispose()
    this.forceArrow.dispose()
  }

  basicPlateMesh () {
    const attributes = grid.getGeometryAttributes()
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setIndex(new THREE.BufferAttribute(attributes.indices, 1))
    this.geometry.addAttribute('position', new THREE.BufferAttribute(attributes.positions, 3))
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(attributes.normals, 3))
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(attributes.uvs, 2))
    this.geometry.addAttribute('color', new THREE.BufferAttribute(attributes.colors, 4))
    this.geometry.addAttribute('vertexBumpScale', new THREE.BufferAttribute(new Float32Array(attributes.positions.length / 2), 1))
    this.geometry.attributes.color.dynamic = true
    this.geometry.attributes.vertexBumpScale.dynamic = true

    this.geometry.computeBoundingSphere()

    return new THREE.Mesh(this.geometry, SHARED_MATERIAL)
  }

  setProps (props) {
    const oldProps = this.props
    this.props = props
    if (props.colormap !== oldProps.colormap) {
      this.updateAttributes()
    }
    if (props.wireframe !== oldProps.wireframe) {
      SHARED_MATERIAL.wireframe = props.wireframe
    }
    if (props.renderVelocities !== oldProps.renderVelocities) {
      this.velocities.visible = props.renderVelocities
      this.velocities.update()
    }
    if (props.renderForces !== oldProps.renderForces) {
      this.forces.visible = props.renderForces
      this.forces.update()
    }
    if (props.renderEulerPoles !== oldProps.renderEulerPoles) {
      this.updateEulerPole()
    }
    if (props.renderHotSpots !== oldProps.renderHotSpots) {
      this.forceArrow.visible = props.renderHotSpots
      this.updateHotSpot()
    }
  }

  update (plate) {
    this.plate = plate
    this.basicMesh.setRotationFromQuaternion(this.plate.quaternion)
    if (this.props.renderVelocities) {
      this.velocities.update()
    }
    if (this.props.renderForces) {
      this.forces.update()
    }
    if (this.props.renderEulerPoles) {
      this.updateEulerPole()
    }
    if (this.props.renderHotSpots) {
      this.updateHotSpot()
    }
    this.updateAttributes()
  }

  updateEulerPole () {
    if (this.props.renderEulerPoles && this.plate.angularSpeed > MIN_SPEED_TO_RENDER_POLE) {
      this.axis.visible = true
      this.axis.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.plate.axisOfRotation)
    } else {
      this.axis.visible = false
    }
  }

  updateHotSpot () {
    this.forceArrow.update(this.plate.hotSpot)
  }

  fieldColor (field) {
    if (this.props.renderBoundaries && field.boundary) {
      return BOUNDARY_COLOR
    }
    if (config.renderCollisions) {
      if (field.subduction) return SUBDUCTION_COLOR
      if (field.collision) return COLLISION_COLOR
    }
    if (this.props.colormap === 'topo') {
      return topoColor(field.elevation)
    } else if (this.props.colormap === 'plate') {
      return hsvToRgb(this.plate.baseColor, field.elevation)
    }
  }

  updateAttributes () {
    const colors = this.colorAttr.array
    const vBumpScale = this.vertexBumpScaleAttr.array
    const nPolys = grid.fields.length
    for (let f = 0; f < nPolys; f += 1) {
      const field = this.plate.fields.get(f)
      const sides = grid.neighboursCount(f)
      let color = field ? this.fieldColor(field) : TRANSPARENT
      if (equalColors(color, this.currentColor[f])) {
        continue
      } else {
        this.currentColor[f] = color
      }
      const c = grid.getFirstVertex(f)
      for (let s = 0; s < sides; s += 1) {
        let cc = (c + s)
        colors[cc * 4] = color.r
        colors[cc * 4 + 1] = color.g
        colors[cc * 4 + 2] = color.b
        colors[cc * 4 + 3] = color.a

        vBumpScale[cc] = field && Math.max(0, field.elevation - 0.6)
      }
    }
    this.colorAttr.needsUpdate = true
    this.vertexBumpScaleAttr.needsUpdate = true
  }
}
