import * as THREE from 'three'
import vertexShader from './plate-mesh-vertex.glsl'
import fragmentShader from './plate-mesh-fragment.glsl'
import VectorField from './vector-field'
import ForceArrow from './force-arrow'
import { hsvToRgb, rgbToHex } from '../colormaps'
import config from '../config'
import grid from '../plates-model/grid'

const MIN_SPEED_TO_RENDER_POLE = 0.002

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

export default class PlateMesh {
  constructor (plate, props) {
    this.plate = plate
    this.baseColor = hsvToRgb(this.plate.baseColor, 0)
    this.adjacentFieldColor = Object.assign({}, this.baseColor, {a: 0.5})

    this.basicMesh = this.basicPlateMesh()
    this.colorAttr = this.basicMesh.geometry.attributes.color
    this.vertexBumpScaleAttr = this.basicMesh.geometry.attributes.vertexBumpScale

    this.root = new THREE.Object3D()
    // Reflect density and subduction order in rendering.
    const scale = 1 + this.plate.density / 1000
    this.root.scale.set(scale, scale, scale)

    this.root.add(this.basicMesh)

    // Color used by various arrows and shapes related to plate (e.g. Euler pole or force arrow).
    this.helpersColor = rgbToHex(hsvToRgb(this.plate.baseColor, 0.8))

    this.axis = axisOfRotation(this.helpersColor)
    this.root.add(this.axis)

    // this.velocities = new VectorField(plate.fields, 'linearVelocity', 0xffffff)
    // this.root.add(this.velocities.root)

    // Per-field forces calculated by physics engine, mostly related to drag and orogeny.
    // this.forces = new VectorField(plate.fields, 'force', 0xff0000)
    // this.root.add(this.forces.root)

    // User-defined force that drives motion of the plate.
    this.forceArrow = new ForceArrow(this.helpersColor)
    this.root.add(this.forceArrow.root)

    this.props = {}
    this.setProps(props)

    this.update(plate)
  }

  basicPlateMesh () {
    const attributes = grid.getGeometryAttributes()
    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(new THREE.BufferAttribute(attributes.indices, 1))
    geometry.addAttribute('position', new THREE.BufferAttribute(attributes.positions, 3))
    geometry.addAttribute('normal', new THREE.BufferAttribute(attributes.normals, 3))
    geometry.addAttribute('uv', new THREE.BufferAttribute(attributes.uvs, 2))
    geometry.addAttribute('color', new THREE.BufferAttribute(attributes.colors, 4))
    geometry.addAttribute('vertexBumpScale', new THREE.BufferAttribute(new Float32Array(attributes.positions.length / 2), 1))
    geometry.attributes.color.dynamic = true
    geometry.attributes.vertexBumpScale.dynamic = true

    geometry.computeBoundingSphere()

    this.material = getMaterial()

    return new THREE.Mesh(geometry, this.material)
  }

  setProps (props) {
    const oldProps = this.props
    this.props = props
    if (props.colormap !== oldProps.colormap) {
      this.updateAttributes()
    }
    if (props.wireframe !== oldProps.wireframe) {
      this.material.wireframe = props.wireframe
    }
    if (props.renderVelocities !== oldProps.renderVelocities) {
      // this.velocities.visible = props.renderVelocities
      // this.velocities.update()
    }
    if (props.renderForces !== oldProps.renderForces) {
      // this.forces.visible = props.renderForces
      // this.forces.update()
    }
    if (props.renderEulerPoles !== oldProps.renderEulerPoles) {
      // this.updateEulerPole()
    }
    if (props.renderHotSpots !== oldProps.renderHotSpots) {
      // this.forceArrow.visible = props.renderHotSpots
      // this.updateHotSpot()
    }
  }

  update (plate) {
    this.plate = plate
    this.basicMesh.setRotationFromQuaternion(this.plate.quaternion)
    // if (this.props.renderVelocities) {
    //   this.velocities.update()
    // }
    // if (this.props.renderForces) {
    //   this.forces.update()
    // }
    // if (this.props.renderEulerPoles) {
    //   this.updateEulerPole()
    // }
    // if (this.props.renderHotSpots) {
    //   this.updateHotSpot()
    // }
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
    const hotSpot = this.plate.hotSpot
    this.forceArrow.update(hotSpot.position, hotSpot.force)
  }

  updateAttributes () {
    this.colorAttr.array = this.plate.colors
    this.vertexBumpScaleAttr.array = this.plate.bumpScale
    this.colorAttr.needsUpdate = true
    this.vertexBumpScaleAttr.needsUpdate = true
  }
}
