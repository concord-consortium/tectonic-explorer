import React, { PureComponent } from 'react'
import BottomPanel from './bottom-panel'
import Model from '../plates-model/model'
import View3D from '../plates-view/view-3d'
import InteractionsManager from '../plates-interactions/interactions-manager'
import { getImageData } from '../utils'
import * as THREE from 'three'
import config from '../config'
import presets from '../presets'

import '../../css/plates.less'

const STEP_INTERVAL = 0.2 // s

// Main component that orchestrates model calculations and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)
    this.rafHandler = this.rafHandler.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)

    // Typical React state. It consists of variables that affect UI based on DOM.
    // When this state is changed, React will trigger typical rendering chain.
    this.state = {
      crossSectionDrawingEnabled: false,
      showCrossSectionView: false
    }
    // State that doesn't trigger React rendering. It consists of variables that affect only canvas-based views
    // and no DOM needs to be updated. It's kept separately for performance reasons. React rendering would add
    // quite a lof of overhead. Some properties can be moved from one type of state to another one (e.g. when we
    // need to add DOM-based UI based on given property). Probably we can come up with better name than 'dynamicState'.
    this.dynamicState = {
      // Array of plates-model/plate instances.
      plates: [],
      // Set of properties used by CrossSectionMarkers view and plates model itself (to calculate cross section data).
      crossSection: {
        point1: null, // THREE.Vector3
        point2: null  // THREE.Vector3
      }
    }

    window.addEventListener('resize', this.windowResize.bind(this))
  }

  windowResize () {
    this.view3d.setSize()
  }

  componentDidMount () {
    const preset = presets[this.props.preset]
    getImageData(preset.img, imgData => {
      this.setupModel(imgData, preset.init)
    })
  }

  componentDidUpdate (prevProps, prevState) {
    this.handleStateChange(prevProps, prevState)
  }

  handleStateChange (prevProps = {}, prevState = {}) {
    const { crossSectionDrawingEnabled, showCrossSectionView } = this.state
    this.interactions.setInteractionEnabled('crossSection', crossSectionDrawingEnabled)
    if (prevState.showCrossSectionView !== showCrossSectionView) {
      this.view3d.setSize()
    }
  }

  handleDynamicStateChange (newState) {
    // Note that newState is only a subset of this.dynamicState, so views don't have to update everything,
    // but only things that have actually changed.
    this.view3d.update(newState)
  }

  // Set state that updates only canvas-based views. No need to perform full React rendering cycle.
  setDynamicState (newState) {
    this.dynamicState = Object.assign(this.dynamicState, newState)
    this.handleDynamicStateChange(newState)
  }

  setupModel (imgData, initFunction) {
    this.model = new Model(imgData, initFunction)
    this.view3d = new View3D(this.view3dContainer)
    this.interactions = new InteractionsManager(this.model, this.view3d)
    this.setupEventListeners()

    // Set initial plates model output.
    this.setDynamicState({plates: this.model.plates})
    this.handleStateChange()

    this.clock = new THREE.Clock()
    this.clock.start()
    this.elapsedTime = 0
    if (config.playing) this.rafHandler()
  }

  step (timestep) {
    this.model.step(timestep)
    this.setDynamicState({plates: this.model.plates})
  }

  setupEventListeners () {
    this.interactions.on('crossSection', state => {
      this.setDynamicState({crossSection: state})
      if (state.finished) {
        this.setState({showCrossSectionView: true})
      }
    })
  }

  rafHandler () {
    window.requestAnimationFrame(this.rafHandler)
    this.elapsedTime += this.clock.getDelta()
    if (this.elapsedTime > STEP_INTERVAL) {
      this.step(STEP_INTERVAL)
      this.elapsedTime = 0
    }
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
    const { showCrossSectionView } = this.state

    return (
      <div className='plates'>
        <div className={`plates-3d-view ${showCrossSectionView ? 'small' : 'full'}`} ref={(c) => { this.view3dContainer = c }} />
        {
          showCrossSectionView &&
          <div className='cross-section-view' ref={(c) => { this.crossSectionContainer = c }} />
        }
        <BottomPanel options={this.options} onOptionChange={this.handleOptionChange} />
      </div>
    )
  }
}
