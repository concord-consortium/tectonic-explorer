import React, { PureComponent } from 'react'
import * as THREE from 'three'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import isEqual from 'lodash/isEqual'
import PlanetWizard from './planet-wizard'
import BottomPanel from './bottom-panel'
import InteractionSelector from './interaction-selector'
import CrossSection, { CROSS_SECTION_TRANSITION_LENGTH } from './cross-section'
import ModelProxy from '../plates-proxy/model-proxy'
import View3D from '../plates-view/view-3d'
import ColorKey from './color-key'
import SmallButton from './small-button'
import InteractionsManager from '../plates-interactions/interactions-manager'
import { getImageData } from '../utils'
import { shouldSwapDirection, getCrossSectionRectangle } from '../plates-model/cross-section-utils'
import config from '../config'
import presets from '../presets'
import { initDatabase, saveModelToCloud, loadModelFromCloud } from '../storage'
import migrateState from '../state-migrations'

import '../../css/plates.less'
import '../../css/react-toolbox-theme.less'

// Check performance every X second (when config.benchmark = true)
const BENCHMARK_INTERVAL = 3000 // ms

// postMessage serialization is expensive. Pass only selected properties.
const WORKER_PROPS = ['playing', 'timestep', 'crossSectionPoint1', 'crossSectionPoint2', 'crossSectionPoint3', 'crossSectionPoint4',
  'crossSectionSwapped', 'showCrossSectionView', 'renderForces', 'renderHotSpots', 'renderBoundaries']
function getWorkerProps (state) {
  // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
  const props = {}
  WORKER_PROPS.forEach(propName => {
    props[propName] = state[propName]
  })
  return props
}

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)
    // Regular React state. Includes properties that can be changed by UI.
    this.state = {
      planetWizard: config.planetWizard,
      modelState: 'notRequested',
      interaction: 'none',
      selectableInteractions: config.selectableInteractions,
      showCrossSectionView: false,
      crossSectionOutput: {
        dataFront: [],
        dataRight: [],
        dataBack: [],
        dataLeft: []
      },
      stepsPerSecond: null,
      playing: config.playing,
      timestep: config.timestep,
      colormap: config.colormap,
      wireframe: config.wireframe,
      renderVelocities: config.renderVelocities,
      renderForces: config.renderForces,
      renderEulerPoles: config.renderEulerPoles,
      renderBoundaries: config.renderBoundaries,
      renderLatLongLines: config.renderLatLongLines,
      snapshotAvailable: false,
      plateDensities: {},
      plateColors: {},
      showCameraResetButton: false,
      lastStoredModel: null,
      savingModel: false
    }
    // State that doesn't need to trigger React rendering (but e.g. canvas update).
    // It's kept separately for performance reasons.
    this.nonReactState = {
      // Time in million of years. Why in non-react state? It gets updated very often, so it doesn't make sense
      // to trigger the whole React rendering machinery just to update tiny piece of DOM.
      time: 0,
      plates: [], // Array of PlateProxy objects, passed to View3D
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3,
      crossSectionCameraAngle: 0,
      debugMarker: new THREE.Vector3(), // THREE.Vector3
      currentHotSpot: null,
      screenWidth: Infinity // will be set soon
    }

    // Plate tectoncis model, handles all the aspects of simulation which are not related to view and interaction.
    this.modelWorker = new Worker(`modelWorker.js${window.location.search}`)
    // Greatly simplified plate tectonics model used by rendering and interaction code.
    // It's updated by messages coming from model worker where real calculations are happening.
    this.modelProxy = new ModelProxy()
    // 3D rendering.
    this.view3d = new View3D(this.getView3DProps(this.completeState()))
    // User interactions, e.g. cross section drawing, force assignment and so on.
    this.interactions = new InteractionsManager(this.view3d, this.completeState())

    this.setupEventListeners()

    // Messages to model worker are queued before model is loaded.
    this.modelMessagesQueue = []

    this.benchmarkPrevTime = 0
    this.benchmarkPrevStepIdx = 0

    this.handleOptionChange = this.handleOptionChange.bind(this)
    this.handleInteractionChange = this.handleInteractionChange.bind(this)
    this.closeCrossSection = this.closeCrossSection.bind(this)
    this.loadPresetModel = this.loadPresetModel.bind(this)
    this.unloadModel = this.unloadModel.bind(this)
    this.saveModel = this.saveModel.bind(this)
    this.setDensities = this.setDensities.bind(this)
    this.reload = this.reload.bind(this)
    this.takeLabeledSnapshot = this.takeLabeledSnapshot.bind(this)
    this.restoreLabeledSnapshot = this.restoreLabeledSnapshot.bind(this)
    this.restoreSnapshot = this.restoreSnapshot.bind(this)
    this.restoreInitialSnapshot = this.restoreInitialSnapshot.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleCameraChange = this.handleCameraChange.bind(this)
    this.handleCrossSectionCameraChange = this.handleCrossSectionCameraChange.bind(this)
    this.resetCamera = this.resetCamera.bind(this)
    this.stepForward = this.stepForward.bind(this)
    window.addEventListener('resize', this.handleResize)

    initDatabase()

    window.p = this
  }

  // Set of properties that depend on current state and are calculate for convenience.
  computedState (state, nonReactState) {
    const { renderForces, interaction } = state
    const { crossSectionPoint1, crossSectionPoint2 } = nonReactState

    let crossSectionPoint3 = null
    let crossSectionPoint4 = null
    if (config.crossSection3d && crossSectionPoint1 && crossSectionPoint2) {
      const rectangle = getCrossSectionRectangle(crossSectionPoint1, crossSectionPoint2)
      crossSectionPoint3 = rectangle.p3
      crossSectionPoint4 = rectangle.p4
    }

    return {
      renderHotSpots: interaction === 'force' || renderForces,
      crossSectionSwapped: shouldSwapDirection(crossSectionPoint1, crossSectionPoint2),
      crossSectionPoint3,
      crossSectionPoint4
    }
  }

  // Sum of regular react state, non-react state and computed properties.
  completeState (state = this.state, nonReactState = this.nonReactState) {
    return Object.assign({}, state, nonReactState, this.computedState(state, nonReactState))
  }

  setNonReactState (newState) {
    const prevCompleteState = this.completeState()
    Object.assign(this.nonReactState, newState)
    this.handleStateUpdate(prevCompleteState)
  }

  getView3DProps (state) {
    // Return the whole state. It doesn't make sense to filter properties at this point, as View3D compares values anyway.
    return Object.assign({}, state, { onCameraChange: this.handleCameraChange })
  }

  // Save part of the app / view state.
  getSerializableAppState () {
    const completeState = this.completeState()
    return {
      showCrossSectionView: completeState.showCrossSectionView,
      crossSectionPoint1: completeState.crossSectionPoint1 && completeState.crossSectionPoint1.toArray(),
      crossSectionPoint2: completeState.crossSectionPoint2 && completeState.crossSectionPoint2.toArray(),
      crossSectionCameraAngle: completeState.crossSectionCameraAngle,
      mainCameraPos: this.view3d.getCameraPosition()
    }
  }

  // Restore the app / view state.
  deserializeAppState (state) {
    this.view3d.setCameraPosition(state.mainCameraPos)
    this.setNonReactState({
      crossSectionPoint1: state.crossSectionPoint1 && (new THREE.Vector3()).fromArray(state.crossSectionPoint1),
      crossSectionPoint2: state.crossSectionPoint1 && (new THREE.Vector3()).fromArray(state.crossSectionPoint2)
    })
    this.setState({
      showCrossSectionView: state.showCrossSectionView
    }, () => {
      // Angle needs to be set in the setState callback to make sure that the 3D cross section view is already available.
      if (state.showCrossSectionView && config.crossSection3d) {
        this.crossSection.setCameraAngle(state.crossSectionCameraAngle)
      }
    })
  }

  // Saves model and part of the app state to the cloud. This method is called when this component receives the current
  // model state from the web worker.
  saveStateToCloud (modelState) {
    this.setState({ savingModel: true })
    const data = {
      version: 1, // data format version
      appState: this.getSerializableAppState(),
      modelState
    }
    saveModelToCloud(data, modelId => {
      this.setState({
        lastStoredModel: modelId,
        savingModel: false
      })
    })
  }

  loadCloudModel (modelId) {
    this.setState({modelState: 'loading'})
    loadModelFromCloud(modelId, serializedModel => {
      // Make sure that the models created by old versions can be still loaded.
      const state = migrateState(serializedModel)
      const appState = state.appState
      const modelState = state.modelState
      this.postMessageToModel({
        type: 'loadModel',
        serializedModel: modelState,
        props: getWorkerProps(this.completeState())
      })
      this.deserializeAppState(appState)
    })
  }

  loadPresetModel (presetName) {
    this.setState({modelState: 'loading'})
    const preset = presets[presetName]
    getImageData(preset.img, imgData => {
      this.postMessageToModel({
        type: 'loadPreset',
        imgData,
        presetName,
        props: getWorkerProps(this.completeState())
      })
    })
  }

  componentDidMount () {
    if (config.preset) {
      this.loadPresetModel(config.preset)
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId)
    }
    this.view3dContainer.appendChild(this.view3d.domElement)

    this.handleResize()
    // Safari layout issue workaround. For some reason it's necessary to call resize function again.
    // Otherwise, the main 3D view won't fill up the whole available height.
    setTimeout(this.handleResize, 100)
  }

  componentDidUpdate (prevProps, prevState) {
    const state = this.state
    if (state.showCrossSectionView !== prevState.showCrossSectionView) {
      setTimeout(this.handleResize, CROSS_SECTION_TRANSITION_LENGTH)
    }
    if (state.interaction === 'crossSection' && prevState.interaction !== 'crossSection') {
      // Pause model when user starts cross-section drawing.
      this.setState({ playing: false })
    }
    const prevCompleteState = this.completeState(prevState)
    this.handleStateUpdate(prevCompleteState)
  }

  get showReload () {
    // Reload button has different effect than restart only if planetWizard mode is enabled. It will start
    // planetWizard again. If there's predefined preset, both reload and restart will have the same outcome.
    return config.planetWizard
  }

  postMessageToModel (data) {
    const { modelState } = this.state
    // Most of the messages require model to exist. If it doesn't, queue messages and send them when it's ready.
    if (modelState === 'loaded' || data.type === 'loadModel' || data.type === 'loadPreset' || data.type === 'unload') {
      this.modelWorker.postMessage(data)
    } else {
      this.modelMessagesQueue.push(data)
    }
  }

  postQueuedModelMessages () {
    while (this.modelMessagesQueue.length > 0) {
      this.modelWorker.postMessage(this.modelMessagesQueue.shift())
    }
  }

  reload () {
    if (config.preset) {
      this.loadPresetModel(config.preset)
    }
    if (config.modelId) {
      this.loadCloudModel(config.modelId)
    }
    if (config.planetWizard) {
      this.setState({ planetWizard: true })
    }
    this.closeCrossSection()
  }

  takeLabeledSnapshot (label) {
    this.postMessageToModel({
      type: 'takeLabeledSnapshot',
      label
    })
  }

  restoreLabeledSnapshot (label) {
    this.postMessageToModel({
      type: 'restoreLabeledSnapshot',
      label
    })
  }

  restoreSnapshot () {
    this.setState({ playing: false }, () => {
      // Make sure that model is paused first. Then restore snapshot.
      this.postMessageToModel({ type: 'restoreSnapshot' })
    })
  }

  restoreInitialSnapshot () {
    this.setState({ playing: false }, () => {
      // Make sure that model is paused first. Then restore snapshot.
      this.postMessageToModel({ type: 'restoreInitialSnapshot' })
    })
  }

  handleStateUpdate (prevCompleteState) {
    const state = this.completeState()
    const prevWorkerProps = getWorkerProps(prevCompleteState)
    const workerProps = getWorkerProps(state)
    // postMessage is pretty expensive, so make sure it's necessary to send worker properties.
    for (let propName of WORKER_PROPS) {
      if (workerProps[propName] !== prevWorkerProps[propName]) {
        this.postMessageToModel({type: 'props', props: workerProps})
        break
      }
    }
    // Passing new properties to View3d and InteractionsManager is cheap on the other hand.
    // Also, those classes will calculate what has changed themselves and they will update only necessary elements.
    this.view3d.setProps(this.getView3DProps(state))
    this.interactions.setProps(state)

    // Update time manually, not to trigger React re-render on every single model step.
    if (state.time !== prevCompleteState.time) {
      this.timeValue.textContent = state.time
    }
  }

  handleDataFromWorker (data) {
    const { modelState, snapshotAvailable } = this.state
    const { debugMarker } = this.nonReactState
    if (modelState === 'loading') {
      this.setState({modelState: 'loaded'})
      this.postQueuedModelMessages()
    }
    if (data.crossSection) {
      this.setState({crossSectionOutput: data.crossSection})
    }
    if (data.debugMarker && !debugMarker.equals(data.debugMarker)) {
      this.setNonReactState({ debugMarker: (new THREE.Vector3()).copy(data.debugMarker) })
    }
    if (data.stepIdx > 0 && !snapshotAvailable) {
      this.setState({snapshotAvailable: true})
    } else if (data.stepIdx === 0 && snapshotAvailable) {
      this.setState({snapshotAvailable: false})
    }
    this.setDensities(this.convertPlatesToDensities(data.plates), true)
    this.setColors(data.plates.reduce(function (plateIdToColor, plate) {
      plateIdToColor[plate.id] = plate.baseColor
      return plateIdToColor
    }, {}))

    this.modelProxy.handleDataFromWorker(data)
    this.setNonReactState({
      plates: this.modelProxy.plates,
      time: this.modelProxy.time
    })

    if (config.benchmark) {
      this.updateBenchmark(data.stepIdx)
    }
  }

  convertPlatesToDensities (plates) {
    let densities = {}
    plates.forEach((plate, index) => {
      densities[plate.id] = index
    })
    return densities
  }

  updateBenchmark (stepIdx) {
    const now = window.performance.now()
    if (now - this.benchmarkPrevTime > BENCHMARK_INTERVAL) {
      this.setState({stepsPerSecond: 1000 * (stepIdx - this.benchmarkPrevStepIdx) / (now - this.benchmarkPrevTime)})
      this.benchmarkPrevStepIdx = stepIdx
      this.benchmarkPrevTime = now
    }
  }

  handleResize () {
    this.view3d.resize(this.view3dContainer)
    const padding = 20
    this.setNonReactState({screenWidth: window.innerWidth - padding})
  }

  handleCameraChange () {
    this.setState({ showCameraResetButton: true })
  }

  handleCrossSectionCameraChange (angle) {
    this.setNonReactState({ crossSectionCameraAngle: angle })
  }

  resetCamera () {
    this.view3d.resetCamera()
    this.setState({ showCameraResetButton: false })
  }

  unloadModel () {
    this.postMessageToModel({ type: 'unload' })
  }

  saveModel () {
    this.postMessageToModel({ type: 'saveModel' })
  }

  stepForward () {
    this.postMessageToModel({ type: 'stepForward' })
  }

  setDensities (densities, preventModelUpdate) {
    if (!isEqual(this.state.plateDensities, densities)) {
      this.setState({ plateDensities: densities })
      // This parameter prevents update loops with the model
      if (!preventModelUpdate) {
        this.postMessageToModel({
          type: 'setDensities',
          densities
        })
      }
    }
  }

  setColors (colors) {
    if (!isEqual(this.state.plateColors, colors)) {
      this.setState({ plateColors: colors })
    }
  }

  setupEventListeners () {
    this.modelWorker.addEventListener('message', (event) => {
      const type = event.data.type
      if (type === 'output') {
        this.handleDataFromWorker(event.data.data)
      } else if (type === 'savedModel') {
        this.saveStateToCloud(event.data.data.savedModel)
      }
    })

    this.interactions.on('crossSectionDrawing', data => {
      this.setNonReactState({
        crossSectionPoint1: data.point1,
        crossSectionPoint2: data.point2
      })
    })
    this.interactions.on('crossSectionDrawingEnd', data => {
      if (!this.state.showCrossSectionView) {
        this.setState({ showCrossSectionView: true })
      }
    })
    this.interactions.on('forceDrawing', data => {
      // Make sure to create a new `currentHotSpot` object, so View3d can detect that this property has been changed.
      this.setNonReactState({currentHotSpot: {position: data.position, force: data.force}})
    })
    this.interactions.on('forceDrawingEnd', data => {
      this.postMessageToModel({type: 'setHotSpot', props: data})
      this.setNonReactState({currentHotSpot: null})
    })
    this.interactions.on('fieldInfo', position => {
      this.postMessageToModel({type: 'fieldInfo', props: {position}})
    })
    this.interactions.on('continentDrawing', position => {
      this.postMessageToModel({type: 'continentDrawing', props: {position}})
    })
    this.interactions.on('continentDrawingEnd', () => {
      this.postMessageToModel({type: 'markIslands'})
    })
    this.interactions.on('continentErasing', position => {
      this.postMessageToModel({type: 'continentErasing', props: {position}})
    })
    this.interactions.on('continentErasingEnd', () => {
      this.postMessageToModel({type: 'markIslands'})
    })
  }

  closeCrossSection () {
    this.setState({ showCrossSectionView: false })
    this.setNonReactState({ crossSectionPoint1: null, crossSectionPoint2: null })
    // Disable cross section drawing too (if active).
    const { interaction } = this.state
    if (interaction === 'crossSection') {
      this.setState({ interaction: 'none' })
    }
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  handleInteractionChange (interaction) {
    this.setState({ interaction })
  }

  getProgressSpinner (spinnerText) {
    return (
      <div className='model-loading'>
        <ProgressBar className='big-spinner' type='circular' mode='indeterminate' multicolor />
        <div>{spinnerText}</div>
      </div>
    )
  }

  render () {
    const { planetWizard, modelState, showCrossSectionView, crossSectionOutput, stepsPerSecond, selectableInteractions,
            interaction, crossSectionSwapped, lastStoredModel, savingModel, showCameraResetButton,
            colormap, plateDensities, plateColors } = this.completeState()

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`}
          ref={(c) => { this.view3dContainer = c }}>
          {
            modelState === 'loading' && this.getProgressSpinner('The model is being prepared')
          }
          {
            savingModel && this.getProgressSpinner('The model is being saved')
          }
          <div className='time-display'><span ref={s => { this.timeValue = s }}>0</span> million years</div>
        </div>
        {
          showCameraResetButton &&
          <SmallButton className='camera-reset' onClick={this.resetCamera} icon='settings_backup_restore'>
            Reset planet<br />orientation
          </SmallButton>
        }
        <ColorKey colormap={colormap} plateColors={plateColors} />
        {
          stepsPerSecond > 0 &&
          <div className='benchmark'>model steps per second: {stepsPerSecond.toFixed(2)}</div>
        }
        <div className='bottom-container'>
          <CrossSection ref={c => { this.crossSection = c }} data={crossSectionOutput} swapped={crossSectionSwapped}
            show={showCrossSectionView} onCrossSectionClose={this.closeCrossSection} onCameraChange={this.handleCrossSectionCameraChange} />
          {
            !planetWizard &&
            <BottomPanel
              options={this.state} onOptionChange={this.handleOptionChange}
              onReload={this.showReload && this.reload} onStepForward={this.stepForward} onSaveModel={this.saveModel}
              lastStoredModel={lastStoredModel} onRestoreSnapshot={this.restoreSnapshot}
              onRestoreInitialSnapshot={this.restoreInitialSnapshot}
            />
          }
        </div>
        {
          planetWizard &&
          <PlanetWizard loadModel={this.loadPresetModel} unloadModel={this.unloadModel}
            setDensities={this.setDensities} setOption={this.handleOptionChange}
            takeLabeledSnapshot={this.takeLabeledSnapshot}
            restoreLabeledSnapshot={this.restoreLabeledSnapshot}
            plateDensities={plateDensities} plateColors={plateColors} />
        }
        <InteractionSelector
          interactions={selectableInteractions}
          currentInteraction={interaction}
          onInteractionChange={this.handleInteractionChange}
        />
      </div>
    )
  }
}
