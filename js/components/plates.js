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
const WORKER_PROPS = ['playing', 'crossSectionPoint1', 'crossSectionPoint2', 'showCrossSectionView',
  'renderVelocities', 'renderForces', 'renderEulerPoles', 'renderBoundaries']

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      modelLoaded: false,
      interaction: 'none',
      crossSectionOutput: [],
      stepsPerSecond: null,
      showCrossSectionView: false,
      playing: config.playing,
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3
      colormap: config.colormap,
      wireframe: config.wireframe,
      renderVelocities: config.renderVelocities,
      renderForces: config.renderForces,
      renderEulerPoles: config.renderEulerPoles,
      renderBoundaries: config.renderBoundaries
    }

    // Plate tectoncis model, handles all the aspects of simulation which are not related to view and interaction.
    this.modelWorker = new Worker(`modelWorker.js${window.location.search}`)
    // Greatly simplified plate tectonics model used by rendering and interaction code.
    // It's updated by messages coming from model worker where real calculations are happening.
    this.modelProxy = new ModelProxy()
    // 3D rendering.
    this.view3d = new View3D(this.view3dProps)
    // User interactions, e.g. cross section drawing, force assignment and so on.
    this.interactions = new InteractionsManager(this.view3d)

    this.setupEventListeners()

    this.benchmarkPrevTime = 0
    this.benchmarkPrevStepIdx = 0

    this.handleOptionChange = this.handleOptionChange.bind(this)
    window.addEventListener('resize', this.resize3DView.bind(this))

    this.loadModel(this.props.preset)
  }

  get renderHotSpots () {
    const {renderForces, interaction} = this.state
    return interaction === 'force' || renderForces
  }

  get workerProps () {
    // Do not pass the whole state, as postMessage serialization is expensive. Pass only selected properties.
    const props = {}
    WORKER_PROPS.forEach(propName => {
      props[propName] = this.state[propName]
    })
    props.renderHotSpots = this.renderHotSpots
    return props
  }

  get view3dProps () {
    // Pass the whole state and compute some additional properties.
    const computedProps = {
      renderHotSpots: this.renderHotSpots
    }
    return Object.assign({}, this.state, computedProps)
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
    this.modelWorker.postMessage({type: 'input', input: this.workerProps})
    this.view3d.setProps(this.view3dProps)
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
        input: this.workerProps
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
      this.setState({
        crossSectionPoint1: data.point1,
        crossSectionPoint2: data.point2
      })
    })
    this.interactions.on('force', data => {
      // this.model.setHotSpot(data.position, data.force)
      // Force update of rendered hot spots, so interaction is smooth.
      // Otherwise, force arrow would be updated after model step and there would be a noticeable delay.
      this.view3d.updateHotSpots()
    })
    this.interactions.on('fieldInfo', position => {
      // console.log(this.model.topFieldAt(position))
    })
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  render () {
    const {modelLoaded, showCrossSectionView, crossSectionOutput, stepsPerSecond} = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`}
             ref={(c) => { this.view3dContainer = c }}/>
        {
          !modelLoaded &&
          <div className='model-loading'><Spinner /> Please wait while the model is being prepared</div>
        }
        {
          stepsPerSecond > 0 &&
          <div className='benchmark'>FPS: {stepsPerSecond.toFixed(2)}</div>
        }
        {
          showCrossSectionView &&
          <CrossSection data={crossSectionOutput}/>
        }
        <BottomPanel options={this.state} onOptionChange={this.handleOptionChange}/>
      </div>
    )
  }
}
