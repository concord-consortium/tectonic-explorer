import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import config from '../config'
import presets from '../presets'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import SortableDensities from './sortable-densities'

import '../../css/planet-wizard.less'

const AVAILABLE_PRESETS = [
  { name: 'plates2', label: '2 plates' },
  { name: 'plates3', label: '3 plates' },
  { name: 'plates4', label: '4 plates' },
  { name: 'plates5', label: '5 plates' },
  { name: 'plates5Uneven', label: '5 plates', info: 'uneven distribution' }
]

export const STEPS_DATA = {
  presets: {
    info: 'Select layout of the planet',
    navigationDisabled: true
  },
  continents: {
    info: 'Draw continents'
  },
  forces: {
    info: 'Assign forces to plates'
  },
  densities: {
    info: 'Order plates'
  }
}

// When there's preset or modelId provided, make sure that preset selection step isn't used.
// It's for authors convenience, so it's not necessary to modify default list of planet wizard steps
// when preloaded model is used in wizard.
const STEPS = config.preset || config.modelId
  ? config.planetWizardSteps.filter(stepName => stepName !== 'presets') : config.planetWizardSteps

@inject('simulationStore') @observer
export default class PlanetWizard extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      step: 0
    }
    this.handleNextButtonClick = this.handleNextButtonClick.bind(this)
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this)
    this.saveModel = this.saveModel.bind(this)
  }

  get currentStep () {
    const { step } = this.state
    return STEPS[step]
  }

  get nextButtonLabel () {
    const { step } = this.state
    return step === STEPS.length - 1 ? 'finish' : 'next'
  }

  get navigationDisabled () {
    return STEPS_DATA[this.currentStep].navigationDisabled
  }

  componentDidMount () {
    const { setOption } = this.props.simulationStore
    setOption('playing', false)
    setOption('interaction', 'none')
    setOption('renderBoundaries', true)
    setOption('renderForces', true)

    this.setupStepOptions()
    this.saveModel()
  }

  componentDidUpdate (prevProps, prevState) {
    const { step } = this.state
    if (step !== prevState.step) {
      this.setupStepOptions()

      if (step > prevState.step) {
        this.saveModel()
      } else {
        this.restoreModel()
      }
    }
  }

  setupStepOptions () {
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
      this.endPlanetWizard()
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
    const { takeLabeledSnapshot } = this.props.simulationStore
    if (this.currentStep !== 'presets') {
      takeLabeledSnapshot(this.currentStep)
    }
  }

  restoreModel () {
    const { restoreLabeledSnapshot } = this.props.simulationStore
    if (this.currentStep !== 'presets') {
      restoreLabeledSnapshot(this.currentStep)
    }
  }

  loadModel (presetInfo) {
    const { loadPresetModel } = this.props.simulationStore
    loadPresetModel(presetInfo.name)
    this.handleNextButtonClick()
  }

  unloadModel () {
    const { unloadModel, setOption } = this.props.simulationStore
    unloadModel()
    setOption('interaction', 'none')
    setOption('selectableInteractions', [])
    setOption('colormap', 'topo')
  }

  setContinentsStep () {
    const { setOption } = this.props.simulationStore
    setOption('interaction', 'continentDrawing')
    setOption('selectableInteractions', [ 'continentDrawing', 'continentErasing', 'none' ])
    setOption('colormap', 'topo')
  }

  setForcesStep () {
    const { setOption } = this.props.simulationStore
    setOption('interaction', 'force')
    setOption('selectableInteractions', [ 'force', 'none' ])
    setOption('colormap', 'topo')
  }

  setDensitiesStep () {
    const { setOption } = this.props.simulationStore
    setOption('interaction', 'none')
    setOption('selectableInteractions', [])
    setOption('colormap', 'plate')
  }

  endPlanetWizard () {
    const { setOption } = this.props.simulationStore
    setOption('planetWizard', false)
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
    const { step } = this.state
    const stepName = this.currentStep
    if (stepName === undefined) {
      return null
    }
    return (
      <div className='planet-wizard'>
        {
          stepName === 'presets' &&
          <div className='planet-wizard-overlay step-plates' data-test='plate-num-options'>
            { AVAILABLE_PRESETS.map(preset => this.renderPreset(preset)) }
          </div>
        }
        {
          stepName === 'densities' &&
          <div className='planet-wizard-overlay step-densities' data-test='plate-density-options'>
            <SortableDensities />
          </div>
        }
        <div className='planet-wizard-bottom-panel'>
          <img src={ccLogo} className='cc-logo-large' data-test='cc-logo-large' />
          <img src={ccLogoSmall} className='cc-logo-small' data-test='cc-logo-small' />
          {
            STEPS.map((stepName, idx) =>
              <span className='step' key={idx} data-test={'step' + idx}>
                {this.renderStep(idx)}
                {this.renderInfo(idx, STEPS_DATA[stepName].info)}
                <div className='divider' />
              </span>
            )
          }
          <Button primary raised label={'back'} disabled={this.navigationDisabled || step === 0} onClick={this.handleBackButtonClick} />
          <Button primary raised label={this.nextButtonLabel} disabled={this.navigationDisabled} onClick={this.handleNextButtonClick} />
        </div>
      </div>
    )
  }
}
