import { observable, computed, action, runInAction, autorun } from 'mobx'
import config from '../config'
import * as THREE from 'three'
import isEqual from 'lodash/isEqual'
import { getCrossSectionRectangle, shouldSwapDirection } from '../plates-model/cross-section-utils'
import presets from '../presets'
import { getImageData } from '../utils'
import { initDatabase, loadModelFromCloud, saveModelToCloud } from '../storage'
import migrateState from '../state-migrations'
import workerController from '../worker-controller'
import ModelStore from './model-store'

// postMessage serialization is expensive. Pass only selected properties. Note that only these properties
// will be available in the worker.
const WORKER_PROPS = ['playing', 'timestep', 'crossSectionPoint1', 'crossSectionPoint2', 'crossSectionPoint3',
  'crossSectionPoint4', 'crossSectionSwapped', 'showCrossSectionView', 'colormap', 'renderForces', 'renderHotSpots',
  'renderBoundaries', 'earthquakes', 'volcanicEruptions']

const DEFAULT_CROSS_SECTION_CAMERA_ANGLE = 3
const DEFAULT_PLANET_CAMERA_POSITION = [4.5, 0, 0] // (x, y, z)

class SimulationStore {
  @observable planetWizard = config.planetWizard
  @observable modelState = 'notRequested'
  @observable interaction = 'none'
  @observable selectableInteractions = config.selectableInteractions
  @observable showCrossSectionView = false
  @observable crossSectionPoint1 = null // THREE.Vector3
  @observable crossSectionPoint2 = null // THREE.Vector3
  @observable.ref crossSectionOutput = {
    dataFront: [],
    dataRight: [],
    dataBack: [],
    dataLeft: []
  }
  @observable playing = config.playing
  @observable timestep = config.timestep
  @observable colormap = config.colormap
  @observable wireframe = config.wireframe
  @observable earthquakes = config.earthquakes
  @observable volcanicEruptions = config.volcanicEruptions
  @observable renderVelocities = config.renderVelocities
  @observable renderForces = config.renderForces
  @observable renderEulerPoles = config.renderEulerPoles
  @observable renderBoundaries = config.renderBoundaries
  @observable renderLatLongLines = config.renderLatLongLines
  @observable renderPlateLabels = config.renderPlateLabels
  @observable planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION
  @observable crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE
  @observable lastStoredModel = null
  @observable savingModel = false
  @observable debugMarker = new THREE.Vector3() // THREE.Vector3
  @observable currentHotSpot = null
  @observable screenWidth = Infinity

  // Greatly simplified plate tectonics model used by rendering and interaction code.
  // It's updated by messages coming from model worker where real calculations are happening.
  @observable model = new ModelStore()

  constructor () {
    initDatabase()
    workerController.on('output', this.handleDataFromWorker)
    workerController.on('savedModel', this.saveStateToCloud)

    if (config.preset) {
      this.loadPresetModel(config.preset)
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId)
    }
  }

  // Computed (and cached!) properties.
  @computed get crossSectionSwapped () {
    return shouldSwapDirection(this.crossSectionPoint1, this.crossSectionPoint2)
  }

  @computed get crossSectionRectangle () {
    if (config.crossSection3d && this.crossSectionPoint1 && this.crossSectionPoint2) {
      return getCrossSectionRectangle(this.crossSectionPoint1, this.crossSectionPoint2, this.crossSectionSwapped)
    }
    return null
  }

  @computed get crossSectionPoint3 () {
    return this.crossSectionRectangle && this.crossSectionRectangle.p3
  }

  @computed get crossSectionPoint4 () {
    return this.crossSectionRectangle && this.crossSectionRectangle.p4
  }

  @computed get crossSectionVisible () {
    return !this.planetWizard && this.showCrossSectionView
  }

  @computed get renderHotSpots () {
    return this.interaction === 'force' || this.renderForces
  }

  @computed get workerProperties () {
    // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
    const props = {}
    WORKER_PROPS.forEach(propName => {
      props[propName] = this[propName]
    })
    return props
  }

  @computed get showCrossSectionCameraReset () {
    return this.crossSectionCameraAngle !== DEFAULT_CROSS_SECTION_CAMERA_ANGLE
  }

  @computed get showPlanetCameraReset () {
    // Slice is necessary to create regular Array from MobxObservableArray.
    return !isEqual(this.planetCameraPosition.slice(), DEFAULT_PLANET_CAMERA_POSITION)
  }

  @computed get snapshotAvailable () {
    return this.model.stepIdx > 0
  }

  // Save part of the app / view state.
  @computed get serializableAppState () {
    return {
      showCrossSectionView: this.showCrossSectionView,
      crossSectionPoint1: this.crossSectionPoint1 && this.crossSectionPoint1.toArray(),
      crossSectionPoint2: this.crossSectionPoint2 && this.crossSectionPoint2.toArray(),
      crossSectionCameraAngle: this.crossSectionCameraAngle,
      mainCameraPos: this.planetCameraPosition.slice()
    }
  }

  // Actions.
  @action.bound setModelState (value) {
    this.modelState = value
  }

  @action.bound setCrossSectionPoints (p1, p2) {
    this.crossSectionPoint1 = p1
    this.crossSectionPoint2 = p2
  }

  @action.bound showCrossSection () {
    this.showCrossSectionView = true
  }

  @action.bound setCurrentHotSpot (position, force) {
    // Make sure to create a new `currentHotSpot` object, so View3d can detect that this property has been changed.
    this.currentHotSpot = { position, force }
  }

  @action.bound setHotSpot (data) {
    this.currentHotSpot = null
    workerController.postMessageToModel({ type: 'setHotSpot', props: data })
  }

  @action.bound setOption (option, value) {
    this[option] = value
  }

  @action.bound setInteraction (interaction) {
    this.interaction = interaction
    if (interaction === 'crossSection') {
      this.playing = false
    }
  }

  @action.bound closeCrossSection () {
    this.showCrossSectionView = false
    this.crossSectionPoint1 = null
    this.crossSectionPoint2 = null
    // Disable cross section drawing too (if active).
    if (this.interaction === 'crossSection') {
      this.interaction = 'none'
    }
  }

  @action.bound setPlanetCameraPosition (posArray) {
    this.planetCameraPosition = posArray
  }

  @action.bound setCrossSectionCameraAngle (angle) {
    this.crossSectionCameraAngle = angle
  }

  @action.bound resetPlanetCamera () {
    this.planetCameraPosition = DEFAULT_PLANET_CAMERA_POSITION
  }

  @action.bound resetCrossSectionCamera () {
    this.crossSectionCameraAngle = DEFAULT_CROSS_SECTION_CAMERA_ANGLE
  }

  @action.bound loadPresetModel (presetName) {
    this.modelState = 'loading'
    const preset = presets[presetName]
    getImageData(preset.img, imgData => {
      workerController.postMessageToModel({
        type: 'loadPreset',
        imgData,
        presetName,
        props: this.workerProperties
      })
    })
  }

  @action.bound loadCloudModel (modelId) {
    this.modelState = 'loading'
    loadModelFromCloud(modelId, serializedModel => {
      // Make sure that the models created by old versions can be still loaded.
      const state = migrateState(serializedModel)
      const appState = state.appState
      const modelState = state.modelState
      this.deserializeAppState(appState)
      workerController.postMessageToModel({
        type: 'loadModel',
        serializedModel: modelState,
        props: this.workerProperties
      })
    })
  }

  // Restore the app / view state.
  @action.bound deserializeAppState (state) {
    this.crossSectionPoint1 = (state.crossSectionPoint1 && (new THREE.Vector3()).fromArray(state.crossSectionPoint1)) || null
    this.crossSectionPoint2 = (state.crossSectionPoint1 && (new THREE.Vector3()).fromArray(state.crossSectionPoint2)) || null
    this.showCrossSectionView = state.showCrossSectionView
    this.planetCameraPosition = state.mainCameraPos
    this.crossSectionCameraAngle = state.crossSectionCameraAngle
  }

  @action.bound handleDataFromWorker (data) {
    if (this.modelState === 'loading') {
      this.modelState = 'loaded'
    }
    if (data.crossSection) {
      this.crossSectionOutput = data.crossSection
    }
    if (data.debugMarker && !this.debugMarker.equals(data.debugMarker)) {
      this.debugMarker = (new THREE.Vector3()).copy(data.debugMarker)
    }
    this.model.handleDataFromWorker(data)
    if (this.model.stepIdx > 0 && this.model.stepIdx % config.stopAfter === 0) {
      this.setOption('playing', false)
    }
  }

  @action.bound setDensities (densities) {
    this.model.plates.forEach(plate => {
      plate.density = densities[plate.id]
    })
    workerController.postMessageToModel({
      type: 'setDensities',
      densities
    })
  }

  // Saves model and part of the app state to the cloud. This method is called when this component receives the current
  // model state from the web worker.
  @action.bound saveStateToCloud (modelState) {
    this.savingModel = true
    const data = {
      version: 2, // data format version
      appState: this.serializableAppState,
      modelState
    }
    saveModelToCloud(data, modelId => {
      runInAction(() => {
        this.lastStoredModel = modelId
        this.savingModel = false
      })
    })
  }

  @action.bound unloadModel () {
    workerController.postMessageToModel({ type: 'unload' })
  }

  @action.bound saveModel () {
    workerController.postMessageToModel({ type: 'saveModel' })
  }

  @action.bound stepForward () {
    workerController.postMessageToModel({ type: 'stepForward' })
  }

  @action.bound reload () {
    if (config.preset) {
      this.loadPresetModel(config.preset)
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId)
    }
    if (config.planetWizard) {
      this.planetWizard = true
    }
    this.closeCrossSection()
  }

  @action.bound takeLabeledSnapshot (label) {
    workerController.postMessageToModel({
      type: 'takeLabeledSnapshot',
      label
    })
  }

  @action.bound restoreLabeledSnapshot (label) {
    workerController.postMessageToModel({
      type: 'restoreLabeledSnapshot',
      label
    })
  }

  @action.bound restoreSnapshot () {
    this.playing = false
    // Make sure that model is paused first. Then restore snapshot.
    workerController.postMessageToModel({ type: 'restoreSnapshot' })
  }

  @action.bound restoreInitialSnapshot () {
    this.playing = false
    // Make sure that model is paused first. Then restore snapshot.
    workerController.postMessageToModel({ type: 'restoreInitialSnapshot' })
  }

  @action.bound setScreenWidth (val) {
    this.screenWidth = val
  }

  // Helpers.
  markField = (position) => {
    workerController.postMessageToModel({ type: 'markField', props: { position } })
  }

  unmarkAllFields = () => {
    workerController.postMessageToModel({ type: 'unmarkAllFields' })
  }

  getFieldInfo = position => {
    workerController.postMessageToModel({ type: 'fieldInfo', props: { position } })
  }

  drawContinent = position => {
    workerController.postMessageToModel({ type: 'continentDrawing', props: { position } })
  }

  eraseContinent = position => {
    workerController.postMessageToModel({ type: 'continentErasing', props: { position } })
  }

  markIslands = () => {
    workerController.postMessageToModel({ type: 'markIslands' })
  }
}

const store = new SimulationStore()

autorun(() => {
  // postMessage is pretty expensive, so make sure it sends properties that are used by worker.
  workerController.postMessageToModel({ type: 'props', props: store.workerProperties })
})

export default store
