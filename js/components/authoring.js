import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import config from '../config'
import presets from '../presets'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'

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
      step: 1
    }
    this.handleButtonClick = this.handleButtonClick.bind(this)
    this.handleInteractionChange = this.handleInteractionChange.bind(this)
  }

  get buttonLabel () {
    const { step } = this.state
    return step === 3 ? 'finish' : 'next'
  }

  get buttonDisabled () {
    const { step } = this.state
    return step === 1
  }

  handleButtonClick () {
    const { step } = this.state
    const { setOption } = this.props
    if (step === 2) {
      setOption('interaction', 'force')
      setOption('selectableInteractions', [ 'force', 'none' ])
      this.setState({step: 3})
    } else if (step === 3) {
      setOption('authoring', false)
      setOption('playing', true)
      setOption('interaction', 'none')
      setOption('colormap', config.colormap)
      setOption('renderForces', config.renderForces)
      setOption('selectableInteractions', config.selectableInteractions)
      this.setState({step: 4})
    }
  }

  handleInteractionChange (interactionName) {
    const { setOption } = this.props
    setOption('interaction', interactionName)
  }

  loadModel (name) {
    const { loadModel, setOption } = this.props
    loadModel(name)
    setOption('interaction', 'drawContinent')
    setOption('selectableInteractions', [ 'drawContinent', 'eraseContinent', 'none' ])
    this.setState({step: 2})
  }

  renderPreset (presetInfo) {
    const preset = presets[presetInfo.name]
    const clickHandler = this.loadModel.bind(this, presetInfo.name)
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
    if (step > 3) {
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
          <div className='divider last' />
          <Button primary raised label={this.buttonLabel} disabled={this.buttonDisabled} onClick={this.handleButtonClick} />
        </div>
      </div>
    )
  }
}
