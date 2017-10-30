import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import config from '../config'
import presets from '../presets'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import SortableDensities from './sortable-densities'

import '../../css/authoring.less'

const AVAILABLE_PRESETS = [
  { name: 'plates2', label: '2 plates' },
  { name: 'plates3', label: '3 plates' },
  { name: 'plates4', label: '4 plates' },
  { name: 'plates5', label: '5 plates' },
  { name: 'plates5Uneven', label: '5 plates', info: 'uneven distribution' }
]

const STEPS = {
  presets: {
    info: 'Select layout of the planet'
  },
  continents: {
    info: 'Draw continents'
  },
  forces: {
    info: 'Assign forces to plates'
  },
  densities: {
    info: 'Order plates by density'
  }
}

export default class Authoring extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      step: 0,
      modelLoading: false
    }
    this.handleNextButtonClick = this.handleNextButtonClick.bind(this)
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this)
    this.saveModel = this.saveModel.bind(this)
  }

  get currentStep () {
    const { step } = this.state
    return config.authoringSteps[step]
  }

  get nextButtonLabel () {
    const { step } = this.state
    return step === config.authoringSteps.length - 1 ? 'finish' : 'next'
  }

  get navigationDisabled () {
    return this.currentStep === 'presets'
  }

  componentDidUpdate (prevProps, prevState) {
    const { step } = this.state
    if (step !== prevState.step) {
      const stepName = this.currentStep
      if (stepName === 'presets') {
        this.unloadModel()
      } else if (stepName === 'continents') {
        this.setContinentsStep()
      } else if (stepName === 'forces') {
        this.setForcesStep()
      } else if (stepName === 'densities') {
        this.setDensitiesStep()
      } else if (stepName === undefined) {
        this.endAuthoring()
      }

      if (step > prevState.step) {
        this.saveModel()
      } else if (stepName !== 'presets') {
        this.restoreModel()
      }
    }
  }

  handleNextButtonClick () {
    const { step } = this.state
    this.setState({ step: step + 1 })
  }

  handleBackButtonClick () {
    const { step } = this.state
    if (step > 0) {
      this.setState({ step: step - 1 })
    }
  }

  saveModel () {
    const { takeLabeledSnapshot } = this.props
    takeLabeledSnapshot(this.currentStep)
  }

  restoreModel () {
    const { restoreLabeledSnapshot } = this.props
    restoreLabeledSnapshot(this.currentStep)
  }

  loadModel (presetInfo) {
    const { loadModel } = this.props
    this.setState({ modelLoading: true })
    loadModel(presetInfo.name, () => {
      // Important! Go to the next step after model load is complete.
      // Otherwise, we might try to take model snapshot too early (when it's not loaded yet).
      this.setState({ modelLoading: false })
      this.handleNextButtonClick()
    })
  }

  unloadModel () {
    const { unloadModel, setOption } = this.props
    unloadModel()
    setOption('interaction', 'none')
    setOption('selectableInteractions', [])
  }

  setContinentsStep () {
    const { setOption } = this.props
    setOption('interaction', 'drawContinent')
    setOption('selectableInteractions', [ 'drawContinent', 'eraseContinent', 'none' ])
  }

  setForcesStep () {
    const { setOption } = this.props
    setOption('interaction', 'force')
    setOption('selectableInteractions', [ 'force', 'none' ])
    setOption('colormap', 'topo')
  }

  setDensitiesStep () {
    const { setOption } = this.props
    setOption('interaction', 'none')
    setOption('selectableInteractions', [])
    setOption('colormap', 'plate')
  }

  endAuthoring () {
    const { setOption } = this.props
    setOption('authoring', false)
    setOption('playing', true)
    setOption('interaction', 'none')
    setOption('colormap', config.colormap)
    setOption('renderBoundaries', config.renderBoundaries)
    setOption('renderForces', config.renderForces)
    setOption('selectableInteractions', config.selectableInteractions)
  }

  renderPreset (presetInfo) {
    const preset = presets[presetInfo.name]
    const clickHandler = this.loadModel.bind(this, presetInfo)
    return (
      <Button className='preset-button' key={presetInfo.name} onClick={clickHandler}>
        <div>
          <img src={preset.img} />
          <div className='label'>
            { presetInfo.label }
            { presetInfo.info && <p className='additional-info'>{ presetInfo.info }</p> }
          </div>
        </div>
      </Button>
    )
  }

  renderStep (idx) {
    const { step } = this.state
    const done = idx < step
    const doneClass = done ? 'done' : ''
    const activeClass = idx === step ? 'active' : ''
    return (
      <span className={`circle ${activeClass} ${doneClass}`} key={'step' + idx}>{ done ? <FontIcon className='check-mark' value='check' /> : (idx + 1) }</span>
    )
  }

  renderInfo (idx, info) {
    const { step } = this.state
    const done = idx < step
    const doneClass = done ? 'done' : ''
    const activeClass = idx === step ? 'active' : ''
    return (
      <span className={`label ${activeClass} ${doneClass}`} key={'info' + idx}>{ info }</span>
    )
  }

  render () {
    const { modelLoading } = this.state
    const stepName = this.currentStep
    if (stepName === undefined) {
      return null
    }
    return (
      <div className='authoring'>
        {
          stepName === 'presets' && !modelLoading &&
          <div className='authoring-overlay step-plates'>
            { AVAILABLE_PRESETS.map(preset => this.renderPreset(preset)) }
          </div>
        }
        {
          stepName === 'densities' &&
          <div className='authoring-overlay step-densities'>
            <SortableDensities plateDensities={this.props.plateDensities} plateColors={this.props.plateColors}
              setDensities={this.props.setDensities} />
          </div>
        }
        <div className='authoring-bottom-panel'>
          <img src={ccLogo} className='cc-logo-large' />
          <img src={ccLogoSmall} className='cc-logo-small' />
          {
            config.authoringSteps.map((stepName, idx) =>
              <span className='step' key={idx}>
                {this.renderStep(idx)}
                {this.renderInfo(idx, STEPS[stepName].info)}
                <div className='divider' />
              </span>
            )
          }
          <Button primary raised label={'back'} disabled={this.navigationDisabled} onClick={this.handleBackButtonClick} />
          <Button primary raised label={this.nextButtonLabel} disabled={this.navigationDisabled} onClick={this.handleNextButtonClick} />
        </div>
      </div>
    )
  }
}
