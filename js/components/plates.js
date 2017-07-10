import React, { PureComponent } from 'react'
import Spinner from './spinner'
import BottomPanel from './bottom-panel'
import CrossSection from './cross-section'
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
const WORKER_PROPS = ['playing', 'crossSectionPoint1', 'crossSectionPoint2', 'showCrossSectionView', 'renderForces',
  'renderHotSpots', 'renderBoundaries']
function getWorkerProps (state) {
  // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
  const props = {}
  WORKER_PROPS.forEach(propName => {
    props[propName] = state[propName]
  })
  return props
}

function getView3DProps (state) {
  // Return the whole state. It doesn't make sense to filter properties at this point, as View3D compares values anyway.
  return state
}

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)
    // Regular React state. Includes properties that can be changed by UI.
    this.state = {
      modelLoaded: false,
      interaction: 'none',
      crossSectionOutput: [],
      stepsPerSecond: null,
      crossSectionAvailable: false,
      showCrossSectionView: false,
      playing: config.playing,
      colormap: config.colormap,
      wireframe: config.wireframe,
      renderVelocities: config.renderVelocities,
      renderForces: config.renderForces,
      renderEulerPoles: config.renderEulerPoles,
      renderBoundaries: config.renderBoundaries
    }
    // State that doesn't need to trigger React rendering (but e.g. canvas update).
    // It's kept separately for performance reasons.
    this.nonReactState = {
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3
      currentHotSpot: null
    }

    // Plate tectoncis model, handles all the aspects of simulation which are not related to view and interaction.
    this.modelWorker = new Worker(`modelWorker.js${window.location.search}`)
    // Greatly simplified plate tectonics model used by rendering and interaction code.
    // It's updated by messages coming from model worker where real calculations are happening.
    this.modelProxy = new ModelProxy()
    // 3D rendering.
    this.view3d = new View3D(getView3DProps(this.completeState()))
    // User interactions, e.g. cross section drawing, force assignment and so on.
    this.interactions = new InteractionsManager(this.view3d)

    this.setupEventListeners()

    this.benchmarkPrevTime = 0
    this.benchmarkPrevStepIdx = 0

    this.handleOptionChange = this.handleOptionChange.bind(this)
    window.addEventListener('resize', this.resize3DView.bind(this))

    this.loadModel(this.props.preset)
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
    this.view3dContainer.appendChild(this.view3d.domElement)
    this.resize3DView()
  }

  componentDidUpdate (prevProps, prevState) {
    const state = this.state
    if (state.interaction !== prevState.interaction) {
      this.interactions.setInteraction(state.interaction)
    }
    if (state.showCrossSectionView !== prevState.showCrossSectionView) {
      this.resize3DView()
    }
    const prevCompleteState = this.completeState(prevState)
    this.handleStateUpdate(prevCompleteState)
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
    // Passing new properties to View3d is cheap on the other hand. Also, View3D will calculate what has changed
    // itself and it will update only necessary elements.
    this.view3d.setProps(getView3DProps(state))
  }

  handleDataFromWorker (data) {
    const {modelLoaded} = this.state
    if (!modelLoaded) {
      this.setState({modelLoaded: true})
    }
    if (data.crossSection) {
      this.setState({crossSectionOutput: data.crossSection})
    }
    this.modelProxy.handleDataFromWorker(data)
    this.update3DView()

    const now = window.performance.now()
    if (config.benchmark && (now - this.benchmarkPrevTime) > BENCHMARK_INTERVAL) {
      this.setState({stepsPerSecond: 1000 * (data.stepIdx - this.benchmarkPrevStepIdx) / (now - this.benchmarkPrevTime)})
      this.benchmarkPrevStepIdx = data.stepIdx
      this.benchmarkPrevTime = now
    }
  }

  update3DView () {
    this.view3d.updatePlates(this.modelProxy.plates)
  }

  resize3DView () {
    this.view3d.resize(this.view3dContainer)
  }

  loadModel (presetName) {
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

  setupEventListeners () {
    this.modelWorker.addEventListener('message', (event) => {
      const type = event.data.type
      if (type === 'output') {
        this.handleDataFromWorker(event.data.data)
      }
    })

    this.interactions.on('crossSection', data => {
      this.setNonReactState({
        crossSectionPoint1: data.point1,
        crossSectionPoint2: data.point2
      })
      if (!this.state.crossSectionAvailable) {
        this.setState({ crossSectionAvailable: true })
      }
    })
    this.interactions.on('forceDrawing', data => {
      // Make sure to create a new `currentHotSpot` object, so View3d can detect that this property has been changed.
      this.setNonReactState({ currentHotSpot: { position: data.position, force: data.force } })
    })
    this.interactions.on('forceDrawingEnd', data => {
      this.modelWorker.postMessage({ type: 'setHotSpot', props: data })
      this.setNonReactState({ currentHotSpot: null })
    })
    this.interactions.on('fieldInfo', position => {
      this.modelWorker.postMessage({ type: 'fieldInfo', props: { position } })
    })
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  render () {
    const { modelLoaded, showCrossSectionView, crossSectionOutput, stepsPerSecond } = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`}
          ref={(c) => { this.view3dContainer = c }} >
        {
          !modelLoaded &&
            <div className='model-loading'>
                <Spinner />
                <div>The model is being prepared</div>
            </div>
        }
        </div>
        {
          stepsPerSecond > 0 &&
          <div className='benchmark'>FPS: {stepsPerSecond.toFixed(2)}</div>
        }
        {
          showCrossSectionView &&
          <CrossSection data={crossSectionOutput} />
        }
        <BottomPanel options={this.state} onOptionChange={this.handleOptionChange} />
      </div>
    )
  }
}
