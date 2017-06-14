import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import PlateMesh from './plate-mesh'
import CrossSectionMarkers from './cross-section-markers'

// Mantle color is actually blue, as it's visible where two plates are diverging.
// This crack should represent oceanic ridge.
const MANTLE_COLOR = 0xb5ebfe

export default class View3D {
  constructor (parent) {
    this.parent = parent
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    })
    this.parent.appendChild(this.renderer.domElement)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.render = this.render.bind(this)
    // Used by interactions manager.
    this.onRenderCallback = function () {}

    this.plateMeshes = new Map()

    this.basicSceneSetup()
    this.addStaticMantle()
    this.addCrossSectionMarkers()
    this.resize()
    this.render()
  }

  get domElement () {
    return this.renderer.domElement
  }

  resize () {
    const width = this.parent.clientWidth
    const height = this.parent.clientHeight
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
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
    const material = new THREE.MeshPhongMaterial({color: MANTLE_COLOR})
    const geometry = new THREE.SphereGeometry(0.99, 64, 64)
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
  }

  addPlateMesh (plate) {
    const plateMesh = new PlateMesh(plate)
    this.plateMeshes.set(plate, plateMesh)
    this.scene.add(plateMesh.root)
    return plateMesh
  }

  addCrossSectionMarkers () {
    this.crossSectionMarkers = new CrossSectionMarkers()
    this.scene.add(this.crossSectionMarkers.root)
  }

  updatePlates (plates) {
    plates.forEach(plate => {
      const mesh = this.plateMeshes.get(plate)
      if (mesh) {
        mesh.update()
      } else {
        this.addPlateMesh(plate)
      }
    })
  }

  updateCrossSectionMarkers (point1, point2) {
    this.crossSectionMarkers.update(point1, point2)
  }

  render () {
    window.requestAnimationFrame(this.render)
    this.controls.update()
    this.light.position.copy(this.camera.position)
    this.onRenderCallback()
    this.renderer.render(this.scene, this.camera)
  }
}
