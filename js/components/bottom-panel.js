import React, { PureComponent } from 'react'
import Button from './button'
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

  get drawCrossSectionLabel () {
    return this.options.crossSectionDrawingEnabled ? 'Finish drawing' : 'Draw a cross section line'
  }

  get openCrossSectionLabel () {
    return this.options.showCrossSectionView ? 'Close cross section view' : 'Open cross section view'
  }

  get openCrossSectionDisabled () {
    return !this.options.crossSectionPoint1 || !this.options.crossSectionPoint2
  }

  toggleOption (event, name) {
    const { onOptionChange } = this.props
    onOptionChange(name, !this.options[name])
  }

  render () {
    return (
      <div className='bottom-panel'>
        <img src={ccLogo} className='cc-logo' />
        <Button name='crossSectionDrawingEnabled' onClick={this.toggleOption}>{this.drawCrossSectionLabel}</Button>
        <Button name='showCrossSectionView' onClick={this.toggleOption} disabled={this.openCrossSectionDisabled}>
          {this.openCrossSectionLabel}
        </Button>
      </div>
    )
  }
}
