import * as THREE from 'three'
import $ from 'jquery'
import EventEmitter from 'eventemitter2'
import CrossSectionDrawing from './cross-section-drawing'
import ForceDrawing from './force-drawing'
import PlanetClick from './planet-click'

const NAMESPACE = 'interactions-manager'

// Mouse position in pixels.
export function mousePos (event, targetElement) {
  const $targetElement = $(targetElement)
  const parentX = $targetElement.offset().left
  const parentY = $targetElement.offset().top
  let x = event.pageX
  let y = event.pageY
  if (event.touches && event.touches.length > 0) {
    x = event.touches[0].pageX
    y = event.touches[0].pageY
  }
  return {x: x - parentX, y: y - parentY}
}

// Normalized mouse position [-1, 1].
export function mousePosNormalized (event, targetElement) {
  const pos = mousePos(event, targetElement)
  const $targetElement = $(targetElement)
  const parentWidth = $targetElement.width()
  const parentHeight = $targetElement.height()
  pos.x = (pos.x / parentWidth) * 2 - 1
  pos.y = -(pos.y / parentHeight) * 2 + 1
  return pos
}

export default class InteractionsManager {
  constructor (view) {
    this.view = view

    this.emitter = new EventEmitter()
    this.raycaster = new THREE.Raycaster()

    this.getIntersection = this.getIntersection.bind(this)
    this.emit = this.emit.bind(this)

    this.interactions = {
      crossSection: new CrossSectionDrawing(this.getIntersection, this.emit),
      force: new ForceDrawing(this.getIntersection, this.emit),
      fieldInfo: new PlanetClick(this.getIntersection, this.emit, 'fieldInfo'),
      markField: new PlanetClick(this.getIntersection, this.emit, 'markField'),
      continentDrawing: new PlanetClick(this.getIntersection, this.emit, 'continentDrawing', 'continentDrawingEnd'),
      continentErasing: new PlanetClick(this.getIntersection, this.emit, 'continentErasing', 'continentErasingEnd')
    }
    this.activeInteraction = null
    this.enablePassiveInteractions()
  }

  setInteraction (name) {
    if (this.activeInteraction) {
      this.activeInteraction.setInactive()
      this.activeInteraction = null
      this.disableEventHandlers()
    }
    if (name !== 'none') {
      this.activeInteraction = this.interactions[name]
      this.activeInteraction.setActive()
      this.enableEventHandlers()
    }
  }

  setScreenWidth (value) {
    this.interactions.crossSection.setScreenWidth(value)
  }

  getIntersection (mesh) {
    return this.raycaster.intersectObject(mesh)[0] || null
  }

  emit (event, data) {
    this.emitter.emit(event, data)
  }

  on (event, handler) {
    this.emitter.on(event, handler)
  }

  enableEventHandlers () {
    const $elem = $(this.view.domElement)
    const interaction = this.activeInteraction
    $elem.on(`mousedown.${NAMESPACE} touchstart.${NAMESPACE}`, (event) => {
      this.view.controls.enableRotate = true
      if (interaction.onMouseDown) {
        const pos = mousePosNormalized(event, this.view.domElement)
        this.raycaster.setFromCamera(pos, this.view.camera)
        this.view.controls.enableRotate = !interaction.onMouseDown()
      }
    })
    $elem.on(`mousemove.${NAMESPACE} touchmove.${NAMESPACE}`, (event) => {
      const pos = mousePosNormalized(event, this.view.domElement)
      this.raycaster.setFromCamera(pos, this.view.camera)
      if (interaction.onMouseMove) {
        interaction.onMouseMove()
      }

      // Passively update the plate label at all times
      // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
      const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64))
      const intersection = this.getIntersection(earthMesh)
      if (intersection) {
        this.emit('labelPlate', intersection.point)
      }
    })
    $elem.on(`mouseup.${NAMESPACE} touchend.${NAMESPACE} touchcancel.${NAMESPACE}`, (event) => {
      if (interaction.onMouseUp) {
        const pos = mousePosNormalized(event, this.view.domElement)
        this.raycaster.setFromCamera(pos, this.view.camera)
        interaction.onMouseUp()
      }
      this.view.controls.enableRotate = true
    })
  }

  disableEventHandlers () {
    $(this.view.domElement).off(`.${NAMESPACE}`)
  }

  enablePassiveInteractions() {
    $(this.view.domElement).on(`mousemove touchmove`, (event) => {
      const pos = mousePosNormalized(event, this.view.domElement)
      this.raycaster.setFromCamera(pos, this.view.camera)

      // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
      const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64))
      const intersection = this.getIntersection(earthMesh)
      this.emit('labelPlate', intersection ? intersection.point : null)
    })
  }
}
