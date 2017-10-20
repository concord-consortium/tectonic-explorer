import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import config from '../config'
import presets from '../presets'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import SortableDensities from './sortable-densities'
import { getURLParam } from '../utils'

import '../../css/authoring.less'

const AVAILABLE_PRESETS = [
  { name: 'plates2', label: '2 plates' },
  { name: 'plates3', label: '3 plates' },
  { name: 'plates4', label: '4 plates' },
  { name: 'plates5', label: '5 plates' }
]

export default class Authoring extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      step: 1,
      intermediateDensities: {}
    }
    this.handleNextButtonClick = this.handleNextButtonClick.bind(this)
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this)
    this.handleInteractionChange = this.handleInteractionChange.bind(this)
    this.setIntermediateDensities = this.setIntermediateDensities.bind(this)
  }

  get nextButtonLabel () {
    const { step } = this.state
    return step === 4 ? 'finish' : 'next'
  }

  get buttonDisabled () {
    const { step } = this.state
    return step === 1
  }

  handleNextButtonClick () {
    const { step } = this.state
    const { setOption, takeSnapshot } = this.props
    if (step === 2) {
      takeSnapshot()
      this.setStep3()
    } else if (step === 3) {
      if (config.densityStepEnabled) {
        takeSnapshot()
        setOption('interaction', 'none')
        setOption('selectableInteractions', [])
        setOption('colormap', 'plate')
        this.setState({step: 4})
      } else {
        this.endAuthoring()
      }
    } else if (step === 4) {
      const { setDensities } = this.props
      setDensities(this.state.intermediateDensities)
      setOption('colormap', 'topo')

      this.endAuthoring()
    }
  }

  handleBackButtonClick () {
    const { step } = this.state
    const { restoreSnapshot } = this.props
    if (step === 2) {
      this.unloadModel()
    } else if (step === 3) {
      restoreSnapshot()
      this.setStep2()
    } else if (step === 4) {
      restoreSnapshot()
      this.setStep3()
    }
  }

  handleInteractionChange (interactionName) {
    const { setOption } = this.props
    setOption('interaction', interactionName)
  }

  loadModel (presetInfo) {
    const { loadModel } = this.props
    loadModel(presetInfo.name)
    this.setStep2()
  }

  unloadModel () {
    const { unloadModel, setOption } = this.props
    unloadModel()
    setOption('interaction', 'none')
    setOption('selectableInteractions', [])
    this.setState({step: 1})
  }

  setIntermediateDensities(densities) {
    this.setState({intermediateDensities: densities})
  }

  setStep2 () {
    const { setOption } = this.props
    setOption('interaction', 'drawContinent')
    setOption('selectableInteractions', [ 'drawContinent', 'eraseContinent', 'none' ])
    this.setState({step: 2})
  }

  setStep3 () {
    const { setOption } = this.props
    setOption('interaction', 'force')
    setOption('selectableInteractions', [ 'force', 'none' ])
    setOption('colormap', 'topo')
    this.setState({step: 3})
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
    this.setState({step: 5})
  }

  renderPreset (presetInfo) {
    const preset = presets[presetInfo.name]
    const clickHandler = this.loadModel.bind(this, presetInfo)
    return (
      <Button className='preset-button' key={presetInfo.name} onClick={clickHandler}>
        <img src={preset.img} />
        <span>{ presetInfo.label }</span>
      </Button>
    )
  }

  renderStep (idx) {
    const { step } = this.state
    const done = idx < step
    const doneClass = done ? 'done' : ''
    const activeClass = idx === step ? 'active' : ''
    return (
      <span className={`circle ${activeClass} ${doneClass}`}>{ done ? <FontIcon className='check-mark' value='check' /> : idx }</span>
    )
  }

  renderInfo (idx, info) {
    const { step } = this.state
    const done = idx < step
    const doneClass = done ? 'done' : ''
    const activeClass = idx === step ? 'active' : ''
    return (
      <span className={`label ${activeClass} ${doneClass}`}>{ info }</span>
    )
  }

  render () {
    const { step } = this.state
    if (step > 4) {
      return null
    }
    return (
      <div className='authoring'>
        {
          step === 1 &&
          <div className='authoring-overlay step-1-plates'>
            { AVAILABLE_PRESETS.map(preset => this.renderPreset(preset)) }
          </div>
        }
        {
          step === 4 &&
          <div className='authoring-overlay step-4-plates'>
            <SortableDensities plates={this.props.plates} setDensities={this.setIntermediateDensities}/>
          </div>
        }
        <div className='authoring-bottom-panel'>
          <img src={ccLogo} className='cc-logo-large' />
          <img src={ccLogoSmall} className='cc-logo-small' />
          { this.renderStep(1) }
          { this.renderInfo(1, 'Select layout of the planet') }
          <div className='divider' />
          { this.renderStep(2) }
          { this.renderInfo(2, 'Draw continents') }
          <div className='divider' />
          { this.renderStep(3) }
          { this.renderInfo(3, 'Assign forces to plates') }
          {
            config.densityStepEnabled &&
              [
                <div className='divider' />,
                this.renderStep(4),
                this.renderInfo(4, 'Order plates by density')
              ]
          }
          <div className='divider last' />
          <Button primary raised label={'back'} disabled={this.buttonDisabled} onClick={this.handleBackButtonClick} />
          <Button primary raised label={this.nextButtonLabel} disabled={this.buttonDisabled} onClick={this.handleNextButtonClick} />
        </div>
      </div>
    )
  }
}
