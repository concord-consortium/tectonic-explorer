import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import PlateMesh from './plate-mesh'
import ModelGridMesh from './model-grid-mesh'
import config from '../config'

export default class View3D {
  constructor ({ canvas, width, height }) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.render = this.render.bind(this)
  }

  // Initial setup of the scene based on model.
  setModel (model) {
    this.model = model
    this.basicSceneSetup()
    this.plates = []
    if (config.renderPlates) {
      this.model.plates.forEach(plate => this.addPlate(plate))
    }
    if (config.renderModelGrid) {
      this.addModelGrid()
    } else {
      this.addStaticMantle()
    }

    this.render()
  }

  basicSceneSetup () {
    const size = this.renderer.getSize()

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(33, size.width / size.height, 0.1, 100)
    this.camera.position.set(4.5, 0, 0)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    this.scene.add(this.camera)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.5
    this.controls.zoomSpeed = 0.5

    this.scene.add(new THREE.AmbientLight(0x4f5359))
    this.scene.add(new THREE.HemisphereLight(0xC6C2B6, 0x3A403B, 0.75))
    this.light = new THREE.PointLight(0xffffff, 0.3)
    this.scene.add(this.light)
  }

  addStaticMantle () {
    // Add "mantle". It won't be visible most of the time (only divergent boundaries).
    const material = new THREE.MeshPhongMaterial({color: 0x6f9bc8})
    const geometry = new THREE.SphereGeometry(0.99, 64, 64)
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
  }

  addModelGrid () {
    this.modelGrid = new ModelGridMesh(this.model)
    this.scene.add(this.modelGrid.root)
  }

  addPlate (plate) {
    const plateMesh = new PlateMesh(plate)
    this.plates.push(plateMesh)
    this.scene.add(plateMesh.root)
  }

  update () {
    this.plates.forEach(mesh => {
      mesh.update()
    })
    if (this.modelGrid) {
      this.modelGrid.update()
    }
  }

  render () {
    window.requestAnimationFrame(this.render)
    this.controls.update()
    this.light.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)
  }
}
