import React, { PureComponent } from 'react'
import ccLogo from '../../images/cc-logo.png'

import '../../css/bottom-panel.less'

export default class BottomPanel extends PureComponent {
  constructor (props) {
    super(props)
    this.toggleOption = this.toggleOption.bind(this)
  }

  get options () {
    return this.props.options
  }

  get crossSectionLabel () {
    return this.options.crossSectionDrawingEnabled ? 'Finish drawing' : 'Draw a cross section line'
  }

  toggleOption (event) {
    const { onOptionChange } = this.props
    const optionName = event.target.dataset.option
    onOptionChange(optionName, !this.options[optionName])
  }

  render () {
    return (
      <div className='bottom-panel'>
        <img src={ccLogo} className='cc-logo' />
        <div className='button' data-option='crossSectionDrawingEnabled' onClick={this.toggleOption}>{this.crossSectionLabel}</div>
      </div>
    )
  }
}
