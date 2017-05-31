import React, { PureComponent } from 'react'
import Model from '../plates-model/model'
import View3D from '../plates-view/view-3d'
import InteractionsManager from '../plates-interactions/interactions-manager'
import { getImageData } from '../utils'
import * as THREE from 'three'
import config from '../config'
import presets from '../presets'

import '../../css/plates-model.less'

const width = window.innerWidth
const height = window.innerHeight

const STEP_INTERVAL = 0.2 // s

// Main component that orchestrates model calculations and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)
    this.rafHandler = this.rafHandler.bind(this)

    // Typical React state. It consists of variables that affect UI based on DOM.
    // When this state is changed, React will trigger typical rendering chain.
    this.state = {
      crossSectionDrawingEnabled: false,
      showCrossSectionView: false
    }
    // State that doesn't trigger React rendering. It consists of variables that affect only canvas-based views
    // and no DOM needs to be updated. It's kept separately for performance reasons. React rendering would add
    // quite a lof of overhead. Some properties can be moved from one type of state to another one (e.g. when we
    // need to add DOM-based UI based on given property).
    this.dynamicState = {
      // Array of plates-model/plate instances.
      plates: [],
      // Set of properties used by CrossSectionMarkers view and plates model itself (to calculate cross section data).
      crossSection: {
        point1: null, // THREE.Vector3
        point2: null, // THREE.Vector3
        finished: false
      }
    }
  }

  // Set state that updates only canvas-based views. No need to perform full React rendering cycle.
  setDynamicState (newState) {
    this.dynamicState = Object.assign(this.dynamicState, newState)
    this.view3d.update(newState)
  }

  componentDidMount () {
    const preset = presets[this.props.preset]
    getImageData(preset.img, imgData => {
      this.setupModel(imgData, preset.init)
    })
  }

  setupModel (imgData, initFunction) {
    this.model = new Model(imgData, initFunction)
    this.view3d = new View3D(this.canvas, width, height)
    this.interactions = new InteractionsManager(this.model, this.view3d)
    this.setupEventListeners()

    // Set initial plates model output.
    this.setDynamicState({plates: this.model.plates})

    this.clock = new THREE.Clock()
    this.clock.start()
    this.elapsedTime = 0
    if (config.playing) this.rafHandler()
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

  step (timestep) {
    this.model.step(timestep)
    this.setDynamicState({plates: this.model.plates})
  }

  render () {
    return (
      <div className='plates-model'>
        <div className='plates-3d-view' style={{width, height}}>
          <canvas ref={(c) => { this.canvas = c }} width={width} height={height} />
        </div>
      </div>
    )
  }
}
