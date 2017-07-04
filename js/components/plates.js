import React, { PureComponent } from 'react'
import BottomPanel from './bottom-panel'
import CrossSection from './cross-section'
import Model from '../plates-model/model'
import View3D from '../plates-view/view-3d'
import InteractionsManager from '../plates-interactions/interactions-manager'
import getCrossSection from '../plates-model/get-cross-section'
import { getImageData } from '../utils'
import * as THREE from 'three'
import config from '../config'
import presets from '../presets'

import '../../css/plates.less'
import '../../css/react-toolbox-theme.less'

// Simulation timestep
const SIM_TIMESTEP = 0.2 // s
// Cross section update interval
const CROSS_SECTION_TIMESTEP = 0.5 // s
// Check performance every X second (when config.benchmark = true)
const BENCHMARK_INTERVAL = 3 // s
// Update plate color every X model steps (it's an expensive calculation)
const PLATE_COLOR_UPDATE_INTERVAL = 10 // model steps

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      playing: config.playing,
      interaction: 'none',
      showCrossSectionView: false,
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3
      crossSectionOutput: [],
      colormap: config.colormap,
      wireframe: config.wireframe,
      renderVelocities: config.renderVelocities,
      renderForces: config.renderForces,
      renderEulerPoles: config.renderEulerPoles,
      renderBoundaries: config.renderBoundaries,
      stepsPerSecond: null
    }

    this.rafHandler = this.rafHandler.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)
    window.addEventListener('resize', this.windowResize.bind(this))
  }

  get view3dProps () {
    // Pass the whole state and compute some additional properties.
    // In the future we could filter state and pass only necessary options,
    // but for now this seems more convenient and shouldn't hurt.
    const { interaction, renderForces } = this.state
    const computedProps = {
      renderHotSpots: interaction === 'force' || renderForces
    }
    return Object.assign({}, this.state, computedProps)
  }

  windowResize () {
    if (this.view3d) {
      this.view3d.resize()
    }
  }

  componentDidMount () {
    const preset = presets[this.props.preset]
    getImageData(preset.img, imgData => {
      this.setupModel(imgData, preset.init)
    })
  }

  componentDidUpdate (prevProps, prevState) {
    const state = this.state
    if (state.interaction !== prevState.interaction) {
      this.interactions.setInteraction(state.interaction)
    }
    if (state.showCrossSectionView !== prevState.showCrossSectionView) {
      // Resize 3D view (it will automatically pick size of its parent container).
      this.view3d.resize()
    }
    if (state.playing !== prevState.playing) {
      if (state.playing) {
        this.clock.start()
        this.rafHandler()
      } else {
        this.clock.stop()
      }
    }
    this.view3d.setProps(this.view3dProps)
  }

  setupModel (imgData, initFunction) {
    this.model = new Model(imgData, initFunction)
    this.view3d = new View3D(this.view3dContainer, this.state)
    this.interactions = new InteractionsManager(this.model, this.view3d)
    this.setupEventListeners()

    this.clock = new THREE.Clock()
    this.clock.start()
    this.crossSectionElapsedTime = 0
    this.benchmarkElapsedTime = 0
    this.benchmarkPrevStepIdx = 0

    // Render initial plates.
    this.view3d.updatePlates(this.model.plates)
    if (config.playing) this.rafHandler()
  }

  rafHandler () {
    if (!this.state.playing) return
    window.requestAnimationFrame(this.rafHandler)
    const delta = this.clock.getDelta()
    this.simulationStep(SIM_TIMESTEP)
    this.crossSectionElapsedTime += delta
    if (this.crossSectionElapsedTime > CROSS_SECTION_TIMESTEP) {
      this.updateCrossSection()
      this.crossSectionElapsedTime = 0
    }
    this.benchmarkElapsedTime += delta
    if (config.benchmark && this.benchmarkElapsedTime > BENCHMARK_INTERVAL) {
      this.setState({ stepsPerSecond: (this.model.stepIdx - this.benchmarkPrevStepIdx) / this.benchmarkElapsedTime })
      this.benchmarkPrevStepIdx = this.model.stepIdx
      this.benchmarkElapsedTime = 0
    }
  }

  simulationStep (timestep) {
    this.model.step(timestep)
    const updateColors = this.model.stepIdx % PLATE_COLOR_UPDATE_INTERVAL === 0
    this.view3d.updatePlates(this.model.plates, updateColors)
  }

  updateCrossSection () {
    const { showCrossSectionView, crossSectionPoint1, crossSectionPoint2 } = this.state
    if (!showCrossSectionView || !crossSectionPoint1 || !crossSectionPoint2) {
      return
    }
    const crossSectionOutput = getCrossSection(this.model.plates, crossSectionPoint1, crossSectionPoint2)
    this.setState({crossSectionOutput})
  }

  setupEventListeners () {
    this.interactions.on('crossSection', data => {
      this.setState({
        crossSectionPoint1: data.point1,
        crossSectionPoint2: data.point2
      })
    })
    this.interactions.on('force', data => {
      this.model.setHotSpot(data.position, data.force)
      // Force update of rendered hot spots, so interaction is smooth.
      // Otherwise, force arrow would be updated after model step and there would be a noticeable delay.
      this.view3d.updateHotSpots()
    })
    this.interactions.on('fieldInfo', position => {
      console.log(this.model.topFieldAt(position))
    })
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  render () {
    const { showCrossSectionView, crossSectionOutput, stepsPerSecond } = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`} ref={(c) => { this.view3dContainer = c }} />
        { stepsPerSecond &&
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
