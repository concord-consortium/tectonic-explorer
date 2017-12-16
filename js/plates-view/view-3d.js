import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import PlateMesh from './plate-mesh'
import ForceArrow from './force-arrow'
import CrossSectionMarkers from './cross-section-markers'
import NPoleLabel from './n-pole-label'
import LatLongLines from './lat-long-lines'
import { rgbToHex, topoColor } from '../colormaps'

// Mantle color is actually blue, as it's visible where two plates are diverging.
// This crack should represent oceanic ridge.
const MANTLE_COLOR = rgbToHex(topoColor(0.40))

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
    this.addLatLongLines()

    this.props = {}
    this.setProps(props)

    this.controls.addEventListener('change', () => {
      const { onCameraChange } = this.props
      if (onCameraChange) {
        onCameraChange()
      }
    })

    this.render()
  }

  get domElement () {
    return this.renderer.domElement
  }

  getCameraPosition () {
    return this.camera.position.toArray()
  }

  setCameraPosition (val) {
    this.camera.position.fromArray(val)
    this.controls.update()
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
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    this.setInitialCameraPos()
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

  setInitialCameraPos () {
    this.camera.position.set(4.5, 0, 0)
  }

  resetCamera () {
    this.setInitialCameraPos()
    this.controls.update()
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
    this.adjustLatLongLinesRadius()
    return plateMesh
  }

  removePlateMesh (plateMesh) {
    this.scene.remove(plateMesh.root)
    plateMesh.dispose()
    this.plateMeshes.delete(plateMesh.plate.id)
    this.adjustLatLongLinesRadius()
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

  addLatLongLines () {
    this.latLongLines = new LatLongLines()
    this.scene.add(this.latLongLines.root)
  }

  adjustLatLongLinesRadius () {
    // Makes sure that lat long lines are always visible, but also not too far away from the plant surface.
    let maxRadius = 0
    this.plateMeshes.forEach(plateMesh => {
      if (maxRadius < plateMesh.radius) {
        maxRadius = plateMesh.radius
      }
    })
    this.latLongLines.radius = maxRadius + 0.002
  }

  setProps (props) {
    const oldProps = this.props
    this.props = props
    if (props.crossSectionPoint1 !== oldProps.crossSectionPoint1 ||
        props.crossSectionPoint2 !== oldProps.crossSectionPoint2 ||
        props.crossSectionCameraAngle !== oldProps.crossSectionCameraAngle) {
      this.crossSectionMarkers.update(props.crossSectionPoint1, props.crossSectionPoint2, props.crossSectionPoint3, props.crossSectionPoint4, props.crossSectionCameraAngle)
    }
    if (props.currentHotSpot !== oldProps.currentHotSpot) {
      this.hotSpotMarker.update(props.currentHotSpot)
    }
    if (props.debugMarker !== oldProps.debugMarker) {
      this.debugMarker.position.copy(props.debugMarker)
    }
    if (props.renderLatLongLines !== oldProps.renderLatLongLines) {
      this.latLongLines.visible = props.renderLatLongLines
    }
    if (props.plates !== oldProps.plates) {
      this.updatePlates(props.plates)
    }
    if (props.time !== oldProps.time) {

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
    this.light.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)
  }
}
