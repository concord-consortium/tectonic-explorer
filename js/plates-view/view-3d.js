import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import PlateMesh from './plate-mesh'
import ForceArrow from './force-arrow'
import CrossSectionMarkers from './cross-section-markers'
import NPoleLabel from './n-pole-label'

// Mantle color is actually blue, as it's visible where two plates are diverging.
// This crack should represent oceanic ridge.
const MANTLE_COLOR = 0xade6fa

export default class View3D {
  constructor (props) {
    this.renderer = new THREE.WebGLRenderer({
      // Enable antialias only on non-high-dpi displays.
      antialias: window.devicePixelRatio < 2
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.render = this.render.bind(this)

    this.plateMeshes = new Map()

    this.basicSceneSetup()
    this.addStaticMantle()
    this.addCrossSectionMarkers()
    this.addHotSpotMarker()
    this.addDebugMarker()
    this.addNPoleMarker()

    this.props = {}
    this.setProps(props)

    this.render()
  }

  get domElement () {
    return this.renderer.domElement
  }

  resize (parent) {
    const width = parent.clientWidth
    const height = parent.clientHeight
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
    this.controls.minDistance = 1.8
    this.controls.maxDistance = 10

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
    const plateMesh = new PlateMesh(plate, this.props)
    this.plateMeshes.set(plate.id, plateMesh)
    this.scene.add(plateMesh.root)
    return plateMesh
  }

  removePlateMesh (plateMesh) {
    this.scene.remove(plateMesh.root)
    plateMesh.dispose()
    this.plateMeshes.delete(plateMesh.plate.id)
  }

  addCrossSectionMarkers () {
    this.crossSectionMarkers = new CrossSectionMarkers()
    this.scene.add(this.crossSectionMarkers.root)
  }

  addHotSpotMarker () {
    this.hotSpotMarker = new ForceArrow(0xff3300)
    this.scene.add(this.hotSpotMarker.root)
  }

  addDebugMarker () {
    const material = new THREE.MeshPhongMaterial({color: 0xff0000})
    const geometry = new THREE.SphereGeometry(0.015, 6, 6)
    this.debugMarker = new THREE.Mesh(geometry, material)
    this.scene.add(this.debugMarker)
  }

  addNPoleMarker () {
    this.nPoleLabel = new NPoleLabel()
    this.nPoleLabel.position.y = 1.03
    this.scene.add(this.nPoleLabel.root)
  }

  setProps (props) {
    const oldProps = this.props
    this.props = props
    if (props.crossSectionPoint1 !== oldProps.crossSectionPoint1 ||
        props.crossSectionPoint2 !== oldProps.crossSectionPoint2) {
      this.crossSectionMarkers.update(props.crossSectionPoint1, props.crossSectionPoint2)
    }
    if (props.currentHotSpot !== oldProps.currentHotSpot) {
      this.hotSpotMarker.update(props.currentHotSpot)
    }
    if (props.debugMarker !== oldProps.debugMarker) {
      this.debugMarker.position.copy(props.debugMarker)
    }
    this.plateMeshes.forEach(mesh => mesh.setProps(props))
  }

  updatePlates (plates) {
    const platePresent = {}
    plates.forEach(plate => {
      platePresent[plate.id] = true
      const mesh = this.plateMeshes.get(plate.id)
      if (mesh) {
        mesh.update(plate)
      } else {
        this.addPlateMesh(plate)
      }
    })
    // Remove plates that don't exist anymore.
    this.plateMeshes.forEach(plateMesh => {
      if (!platePresent[plateMesh.plate.id]) {
        this.removePlateMesh(plateMesh)
      }
    })
  }

  render () {
    window.requestAnimationFrame(this.render)
    this.controls.update()
    this.light.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)
  }
}
