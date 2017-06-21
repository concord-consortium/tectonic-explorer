import React, { PureComponent } from 'react'
import ccLogo from '../../images/cc-logo.png'
import Switch from 'react-toolbox/lib/switch'
import { Button, IconButton } from 'react-toolbox/lib/button'
import SidebarMenu from './sidebar-menu'

import '../../css/bottom-panel.less'

export default class BottomPanel extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      sidebarActive: false
    }
    this.toggleSidebar = this.toggleSidebar.bind(this)
    this.handleCrossSectionDrawingChange = this.handleCrossSectionDrawingChange.bind(this)
    this.handleCrossSectionViewChange = this.handleChange.bind(this, 'showCrossSectionView')
  }

  get options () {
    return this.props.options
  }

  get drawCrossSectionLabel () {
    return this.options.interaction === 'crossSection' ? 'Finish drawing' : 'Draw a cross section line'
  }

  get openCrossSectionDisabled () {
    return !this.options.crossSectionPoint1 || !this.options.crossSectionPoint2
  }

  handleChange (name, value) {
    const { onOptionChange } = this.props
    onOptionChange(name, value)
  }

  handleCrossSectionDrawingChange (name) {
    const { onOptionChange, options } = this.props
    onOptionChange('interaction', options.interaction === 'crossSection' ? 'none' : 'crossSection')
  }

  toggleSidebar () {
    const { sidebarActive } = this.state
    this.setState({ sidebarActive: !sidebarActive })
  }

  render () {
    const { sidebarActive } = this.state
    const { onOptionChange } = this.props
    const options = this.options
    return (
      <div className='bottom-panel'>
        <img src={ccLogo} className='cc-logo' />
        <div className='cross-section-widgets'>
          <Button
            className='inline-widget'
            raised primary
            label={this.drawCrossSectionLabel}
            onClick={this.handleCrossSectionDrawingChange}
          />
          <Switch
            className='inline-widget'
            checked={options.showCrossSectionView}
            label='Cross section view'
            onChange={this.handleCrossSectionViewChange}
            disabled={this.openCrossSectionDisabled}
          />
        </div>
        <IconButton icon='menu' onClick={this.toggleSidebar} />
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} onOptionChange={onOptionChange} options={options} />
      </div>
    )
  }
}
