import React, { PureComponent } from 'react'
import * as THREE from 'three'
import BottomPanel from './bottom-panel'
import CrossSection from './cross-section'
import View3D from '../plates-view/view-3d'
import InteractionsManager from '../plates-interactions/interactions-manager'
import { getImageData } from '../utils'
import config from '../config'
import presets from '../presets'

import '../../css/plates.less'
import '../../css/react-toolbox-theme.less'

// Check performance every X second (when config.benchmark = true)
const BENCHMARK_INTERVAL = 3000 // ms

function vec3 (v) {
  return new THREE.Vector3(v.x, v.y, v.z)
}

function quat (q) {
  return new THREE.Quaternion(q._x, q._y, q._z, q._w)
}

function deserialize (modelOutput) {
  modelOutput.plates.forEach(plate => {
    plate.quaternion = quat(plate.quaternion)
    plate.axisOfRotation = vec3(plate.axisOfRotation)
    plate.hotSpot.position = vec3(plate.hotSpot.position)
    plate.hotSpot.force = vec3(plate.hotSpot.force)
  })
  return modelOutput
}

// Main component that orchestrates simulation progress and view updates.
export default class Plates extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      interaction: 'none',
      crossSectionOutput: [],
      stepsPerSecond: null,
      showCrossSectionView: false,
      modelInput: {
        targetStepIdx: config.playing ? Infinity : 0,
        crossSectionPoint1: null, // THREE.Vector3
        crossSectionPoint2: null, // THREE.Vector3
        colormap: config.colormap,
        wireframe: config.wireframe,
        renderVelocities: config.renderVelocities,
        renderForces: config.renderForces,
        renderEulerPoles: config.renderEulerPoles,
        renderBoundaries: config.renderBoundaries
      }
    }
    // We don't need to keep it in react state. Model output affects model rendering which is mostly done outside React.
    this.modelOutput = {}

    this.handleOptionChange = this.handleOptionChange.bind(this)
    window.addEventListener('resize', this.windowResize.bind(this))

    window.p = this
  }

  get modelInput () {
    // Pass the whole state and compute some additional properties.
    // In the future we could filter state and pass only necessary options,
    // but for now this seems more convenient and shouldn't hurt.
    const { modelInput, interaction } = this.state
    const computedProps = {
      renderHotSpots: interaction === 'force' || modelInput.renderForces
    }
    return Object.assign({}, modelInput, computedProps)
  }

  handleModelOutput (output) {
    this.modelOutput = deserialize(output)
    if (output.crossSection) {
      this.setState({crossSectionOutput: output.crossSection})
    }
    this.renderModel(output)

    const now = performance.now()
    if (config.benchmark && (now - this.benchmarkPrevTime) > BENCHMARK_INTERVAL) {
      this.setState({ stepsPerSecond: 1000 * (output.stepIdx - this.benchmarkPrevStepIdx) / (now - this.benchmarkPrevTime) })
      this.benchmarkPrevStepIdx = output.stepIdx
      this.benchmarkPrevTime = now
    }
  }

  renderModel (output) {
    this.view3d.updatePlates(output.plates)
  }

  windowResize () {
    if (this.view3d) {
      this.view3d.resize()
    }
  }

  componentDidMount () {
    const preset = presets[this.props.preset]
    getImageData(preset.img, imgData => {
      this.setupModel(imgData, this.props.preset)
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
    this.view3d.setProps(this.modelInput)
  }

  setupModel (imgData, presetName) {
    // this.model = new Model(imgData, initFunction)
    this.modelWorker = new Worker(`modelWorker.js${window.location.search}`)
    this.modelWorker.addEventListener('message', (event) => {
      const type = event.data.type
      if (type === 'output') {
        this.handleModelOutput(event.data.data)
      }
    })
    this.modelWorker.postMessage({
      type: 'load',
      imgData,
      presetName,
      input: this.modelInput
    })

    this.view3d = new View3D(this.view3dContainer, this.modelInput)
    this.interactions = new InteractionsManager(this.view3d)
    this.setupEventListeners()

    this.benchmarkPrevTime = 0
    this.benchmarkPrevStepIdx = 0
  }

  setupEventListeners () {
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
    const { modelInput } = this.state
    this.setState({ modelInput: Object.assign({}, modelInput, { [option]: value }) })
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
