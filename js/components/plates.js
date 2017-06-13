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

// Simulation timestep
const SIM_TIMESTEP = 0.2 // s
// Cross section update interval
const CROSS_SECTION_TIMESTEP = 0.5 // s

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      crossSectionDrawingEnabled: false,
      showCrossSectionView: false,
      crossSectionPoint1: null, // THREE.Vector3
      crossSectionPoint2: null, // THREE.Vector3
      crossSectionOutput: []
    }

    this.rafHandler = this.rafHandler.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)
    window.addEventListener('resize', this.windowResize.bind(this))
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
    this.interactions.setInteractionEnabled('crossSection', state.crossSectionDrawingEnabled)
    if (state.showCrossSectionView !== prevState.showCrossSectionView) {
      // Resize 3D view (it will automatically pick size of its parent container).
      this.view3d.resize()
    }
    if (state.crossSectionPoint1 !== prevState.crossSectionPoint1 ||
        state.crossSectionPoint2 !== prevState.crossSectionPoint2) {
      this.view3d.updateCrossSectionMarkers(state.crossSectionPoint1, state.crossSectionPoint2)
    }
  }

  setupModel (imgData, initFunction) {
    this.model = new Model(imgData, initFunction)
    this.view3d = new View3D(this.view3dContainer)
    this.interactions = new InteractionsManager(this.model, this.view3d)
    this.setupEventListeners()

    this.clock = new THREE.Clock()
    this.clock.start()
    this.simElapsedTime = 0
    this.crossSectionElapsedTime = 0

    // Render initial plates.
    this.view3d.updatePlates(this.model.plates)
    if (config.playing) this.rafHandler()
  }

  rafHandler () {
    window.requestAnimationFrame(this.rafHandler)
    const delta = this.clock.getDelta()
    this.simElapsedTime += delta
    this.crossSectionElapsedTime += delta
    if (this.simElapsedTime > SIM_TIMESTEP) {
      this.simulationStep(SIM_TIMESTEP)
      this.simElapsedTime = 0
    }
    if (this.crossSectionElapsedTime > CROSS_SECTION_TIMESTEP) {
      this.updateCrossSection()
      this.crossSectionElapsedTime = 0
    }
  }

  simulationStep (timestep) {
    this.model.step(timestep)
    this.view3d.updatePlates(this.model.plates)
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
  }

  // .options and .handleOptionChange are used by BottomPanel. For now, we can just pass the whole state as
  // options, but in the future it might sense to extract its subset.
  get options () {
    return this.state
  }

  handleOptionChange (option, value) {
    const newState = {}
    newState[option] = value
    this.setState(newState)
  }

  render () {
    const { showCrossSectionView, crossSectionOutput } = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`} ref={(c) => { this.view3dContainer = c }} />
        {
          showCrossSectionView &&
          <CrossSection data={crossSectionOutput} />
        }
        <BottomPanel options={this.options} onOptionChange={this.handleOptionChange} />
      </div>
    )
  }
}
