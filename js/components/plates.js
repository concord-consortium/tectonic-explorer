import React, { PureComponent } from 'react'
import * as THREE from 'three'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import Authoring from './authoring'
import BottomPanel from './bottom-panel'
import InteractionSelector from './interaction-selector'
import CrossSection, { CROSS_SECTION_TRANSITION_LENGTH } from './cross-section'
import ModelProxy from '../plates-proxy/model-proxy'
import View3D from '../plates-view/view-3d'
import InteractionsManager from '../plates-interactions/interactions-manager'
import { getImageData } from '../utils'
import config from '../config'
import presets from '../presets'

import '../../css/plates.less'
import '../../css/react-toolbox-theme.less'

// Check performance every X second (when config.benchmark = true)
const BENCHMARK_INTERVAL = 3000 // ms

// postMessage serialization is expensive. Pass only selected properties.
const WORKER_PROPS = ['playing', 'timestep', 'crossSectionPoint1', 'crossSectionPoint2', 'showCrossSectionView',
  'renderForces', 'renderHotSpots', 'renderBoundaries']
function getWorkerProps (state) {
  // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
  const props = {}
  WORKER_PROPS.forEach(propName => {
    props[propName] = state[propName]
  })
  return props
}

// Return the whole state. It doesn't make sense to filter properties at this point, as View3D compares values anyway.
function getView3DProps (state) {
  return state
}

// See above, the same situation.
function getInteractionProps (state) {
  return state
}

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)
    // Regular React state. Includes properties that can be changed by UI.
    this.state = {
      authoring: config.authoring,
      modelState: 'notRequested',
      interaction: 'none',
      selectableInteractions: config.selectableInteractions,
      showCrossSectionView: false,
      crossSectionOutput: {
        data: [],
        swapped: false
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
      snapshotAvailable: false
    }
    // State that doesn't need to trigger React rendering (but e.g. canvas update).
    // It's kept separately for performance reasons.
    this.nonReactState = {
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3
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
    this.view3d = new View3D(getView3DProps(this.completeState()))
    // User interactions, e.g. cross section drawing, force assignment and so on.
    this.interactions = new InteractionsManager(this.view3d, getInteractionProps(this.completeState()))

    this.setupEventListeners()

    this.benchmarkPrevTime = 0
    this.benchmarkPrevStepIdx = 0

    this.handleOptionChange = this.handleOptionChange.bind(this)
    this.handleInteractionChange = this.handleInteractionChange.bind(this)
    this.handleCrossSectionClose = this.handleCrossSectionClose.bind(this)
    this.loadModel = this.loadModel.bind(this)
    this.unloadModel = this.unloadModel.bind(this)
    this.setDensities = this.setDensities.bind(this)
    this.reload = this.reload.bind(this)
    this.restoreSnapshot = this.restoreSnapshot.bind(this)
    this.restoreInitialSnapshot = this.restoreInitialSnapshot.bind(this)
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)

    window.p = this
  }

  // Set of properties that depend on current state and are calculate for convenience.
  computedState (state, nonReactState) {
    const {renderForces, interaction} = state
    return {
      renderHotSpots: interaction === 'force' || renderForces
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

  componentDidMount () {
    if (config.preset) {
      this.loadModel(config.preset)
    }
    if (config.authoring) {
      this.initializeAuthoring()
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
    if (state.authoring && !prevState.authoring) {
      this.initializeAuthoring()
    }
    const prevCompleteState = this.completeState(prevState)
    this.handleStateUpdate(prevCompleteState)
  }

  get showReload () {
    // Reload button has different effect than restart only if authoring mode is enabled. It will start
    // authoring again. If there's predefined preset, both reload and restart will have the same outcome.
    return config.authoring
  }

  reload () {
    if (config.preset) {
      this.loadModel(config.preset)
    } else if (config.authoring) {
      this.setState({ authoring: true })
      this.unloadModel()
    }
  }

  initializeAuthoring () {
    this.setState({
      playing: false,
      interaction: 'none',
      colormap: 'topo',
      renderBoundaries: true,
      renderForces: true,
      selectableInteractions: [],
      showCrossSectionView: false
    })
    this.setNonReactState({
      crossSectionPoint1: null,
      crossSectionPoint2: null
    })
  }

  restoreSnapshot () {
    this.setState({ playing: false }, () => {
      // Make sure that model is paused first. Then restore snapshot.
      this.modelWorker.postMessage({ type: 'restoreSnapshot' })
    })
  }

  restoreInitialSnapshot () {
    this.setState({ playing: false }, () => {
      // Make sure that model is paused first. Then restore snapshot.
      this.modelWorker.postMessage({ type: 'restoreInitialSnapshot' })
    })
  }

  handleStateUpdate (prevCompleteState) {
    const state = this.completeState()
    const prevWorkerProps = getWorkerProps(prevCompleteState)
    const workerProps = getWorkerProps(state)
    // postMessage is pretty expensive, so make sure it's necessary to send worker properties.
    for (let propName of WORKER_PROPS) {
      if (workerProps[propName] !== prevWorkerProps[propName]) {
        this.modelWorker.postMessage({type: 'props', props: workerProps})
        break
      }
    }
    // Passing new properties to View3d and InteractionsManager is cheap on the other hand.
    // Also, those classes will calculate what has changed themselves and they will update only necessary elements.
    this.view3d.setProps(getView3DProps(state))
    this.interactions.setProps(getInteractionProps(state))
  }

  handleDataFromWorker (data) {
    const { modelState, snapshotAvailable } = this.state
    const { debugMarker } = this.nonReactState
    if (modelState === 'loading') {
      this.setState({modelState: 'loaded'})
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

    this.modelProxy.handleDataFromWorker(data)
    this.update3DView()

    if (config.benchmark) {
      this.updateBenchmark(data.stepIdx)
    }
  }

  updateBenchmark (stepIdx) {
    const now = window.performance.now()
    if (now - this.benchmarkPrevTime > BENCHMARK_INTERVAL) {
      this.setState({stepsPerSecond: 1000 * (stepIdx - this.benchmarkPrevStepIdx) / (now - this.benchmarkPrevTime)})
      this.benchmarkPrevStepIdx = stepIdx
      this.benchmarkPrevTime = now
    }
  }

  update3DView () {
    this.view3d.updatePlates(this.modelProxy.plates)
  }

  handleResize () {
    this.view3d.resize(this.view3dContainer)
    const padding = 20
    this.setNonReactState({screenWidth: window.innerWidth - padding})
  }

  loadModel (presetName) {
    this.setState({modelState: 'loading'})
    const preset = presets[presetName]
    getImageData(preset.img, imgData => {
      this.modelWorker.postMessage({
        type: 'load',
        imgData,
        presetName,
        props: getWorkerProps(this.completeState())
      })
    })
  }

  unloadModel () {
    this.modelWorker.postMessage({ type: 'unload' })
  }

  setDensities (densities) {
    this.modelWorker.postMessage({
      type: 'setDensities',
      densities
    })
  }

  setupEventListeners () {
    this.modelWorker.addEventListener('message', (event) => {
      const type = event.data.type
      if (type === 'output') {
        this.handleDataFromWorker(event.data.data)
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
      this.modelWorker.postMessage({type: 'setHotSpot', props: data})
      this.setNonReactState({currentHotSpot: null})
    })
    this.interactions.on('fieldInfo', position => {
      this.modelWorker.postMessage({type: 'fieldInfo', props: {position}})
    })
    this.interactions.on('drawContinent', position => {
      this.modelWorker.postMessage({type: 'drawContinent', props: {position}})
    })
    this.interactions.on('eraseContinent', position => {
      this.modelWorker.postMessage({type: 'eraseContinent', props: {position}})
    })
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  handleInteractionChange (interaction) {
    this.setState({ interaction })
  }

  handleCrossSectionClose () {
    this.setState({ showCrossSectionView: false })
    this.setNonReactState({ crossSectionPoint1: null, crossSectionPoint2: null })
  }

  render () {
    const { authoring, modelState, showCrossSectionView, crossSectionOutput, stepsPerSecond, selectableInteractions, interaction } = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`}
          ref={(c) => { this.view3dContainer = c }}>
          {
            modelState === 'loading' &&
            <div className='model-loading'>
              <ProgressBar className='big-spinner' type='circular' mode='indeterminate' multicolor />
              <div>The model is being prepared</div>
            </div>
          }
        </div>
        {
          stepsPerSecond > 0 &&
          <div className='benchmark'>FPS: {stepsPerSecond.toFixed(2)}</div>
        }
        <div className='bottom-container'>
          <CrossSection data={crossSectionOutput.data} swapped={crossSectionOutput.swapped} show={showCrossSectionView}
            onCrossSectionClose={this.handleCrossSectionClose} />
          {
            !authoring &&
            <BottomPanel
              options={this.state} onOptionChange={this.handleOptionChange}
              onReload={this.showReload && this.reload}
              onRestoreSnapshot={this.restoreSnapshot} onRestoreInitialSnapshot={this.restoreInitialSnapshot}
            />
          }
        </div>
        {
          authoring &&
          <Authoring loadModel={this.loadModel} unloadModel={this.unloadModel} 
                     setDensities={this.setDensities} setOption={this.handleOptionChange}
                     plates={this.modelProxy.plates} />
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
