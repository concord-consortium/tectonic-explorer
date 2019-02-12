import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import { autorun, observe } from 'mobx'
import PlateMesh from './plate-mesh'
import FieldMarker from './field-marker'
import ForceArrow from './force-arrow'
import CrossSectionMarkers from './cross-section-markers'
import NPoleLabel from './n-pole-label'
import LatLongLines from './lat-long-lines'
import { rgbToHex, topoColor } from '../colormaps'
import getThreeJSRenderer from '../get-threejs-renderer'

import '../../css/planet-view.less'

// Mantle color is actually blue, as it's visible where two plates are diverging.
// This crack should represent oceanic ridge.
const MANTLE_COLOR = rgbToHex(topoColor(0.40))

export default class PlanetView {
  constructor (store) {
    this.store = store

    const Renderer = getThreeJSRenderer()
    this.renderer = new Renderer({
      // Enable antialias only on non-high-dpi displays.
      antialias: window.devicePixelRatio < 2
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.plateMeshes = new Map()

    this.basicSceneSetup()
    this.addStaticMantle()
    this.addCrossSectionMarkers()
    this.addHotSpotMarker()
    this.addDebugMarker()
    this.addNPoleMarker()
    this.addLatLongLines()

    // Little markers that can be used to trace some fields.
    this.fieldMarkers = []

    this.suppressCameraChangeEvent = false
    this.controls.addEventListener('change', () => {
      if (!this.suppressCameraChangeEvent) {
        this.store.setPlanetCameraPosition(this.getCameraPosition())
      }
    })

    // See shutterbug-support.js
    if (this.domElement.className.indexOf('canvas-3d') === -1) {
      this.domElement.className += ' canvas-3d'
    }
    this.domElement.render = this.render.bind(this)

    this.requestAnimFrame = this.requestAnimFrame.bind(this)
    this.requestAnimFrame()

    this.observeStore(store)
  }

  observeStore (store) {
    autorun(() => {
      this.crossSectionMarkers.update(store.crossSectionPoint1, store.crossSectionPoint2, store.crossSectionPoint3, store.crossSectionPoint4, store.crossSectionCameraAngle)
      this.hotSpotMarker.update(store.currentHotSpot)
      this.debugMarker.position.copy(store.debugMarker)
      this.latLongLines.visible = store.renderLatLongLines
    })
    autorun(() => {
      this.setFieldMarkers(store.model.fieldMarkers)
    })
    // Keep observers separate due to performance reasons. Camera position update happens very often, so keep this
    // observer minimal.
    autorun(() => {
      this.setCameraPosition(store.planetCameraPosition)
    })
    observe(store.model.platesMap, () => {
      this.updatePlates(store.model.platesMap)
    })
  }

  get domElement () {
    return this.renderer.domElement
  }

  dispose () {
    // There's no need for the app / view to remove itself and cleanup, but keep it here as a reminder
    // if requirements change in the future.
    console.warn('View3D#dispose is not implemented!')
    // If it's ever necessary, remember to dispose mobx observers.
  }

  getCameraPosition () {
    return this.camera.position.toArray()
  }

  setCameraPosition (val) {
    this.suppressCameraChangeEvent = true
    this.camera.position.fromArray(val)
    this.controls.update()
    this.suppressCameraChangeEvent = false
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
    this.camera.position.set(4.5, 0, 0)
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
    const material = new THREE.MeshPhongMaterial({ color: MANTLE_COLOR })
    const geometry = new THREE.SphereGeometry(0.985, 64, 64)
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
  }

  addPlateMesh (plate) {
    const plateMesh = new PlateMesh(plate.id, this.store)
    this.plateMeshes.set(plate.id, plateMesh)
    this.scene.add(plateMesh.root)
    this.adjustLatLongLinesRadius()
    return plateMesh
  }

  removePlateMesh (plateMesh) {
    this.scene.remove(plateMesh.root)
    plateMesh.dispose()
    this.plateMeshes.delete(plateMesh.plateId)
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
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 })
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

  setFieldMarkers (markers) {
    while (this.fieldMarkers.length < markers.length) {
      const fieldMarker = new FieldMarker(0xff0000)
      this.fieldMarkers.push(fieldMarker)
      this.scene.add(fieldMarker.root)
    }
    while (this.fieldMarkers.length > markers.length) {
      const fieldMarker = this.fieldMarkers.pop()
      this.scene.remove(fieldMarker.root)
      fieldMarker.dispose()
    }
    markers.forEach((markerPos, idx) => {
      this.fieldMarkers[idx].setPosition(markerPos)
    })
  }

  updatePlates (plates) {
    const platePresent = {}
    plates.forEach(plate => {
      platePresent[plate.id] = true
      if (!this.plateMeshes.has(plate.id)) {
        this.addPlateMesh(plate)
      }
    })
    // Remove plates that don't exist anymore.
    this.plateMeshes.forEach(plateMesh => {
      if (!platePresent[plateMesh.plateId]) {
        this.removePlateMesh(plateMesh)
      }
    })
  }

  requestAnimFrame () {
    window.requestAnimationFrame(this.requestAnimFrame)
    this.render()
  }

  render () {
    this.light.position.copy(this.camera.position)
    this.renderer.render(this.scene, this.camera)
  }
}
