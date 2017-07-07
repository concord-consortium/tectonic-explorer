import React, { PureComponent } from 'react'
import ccLogo from '../../images/cc-logo.png'
import Switch from 'react-toolbox/lib/switch'
import { Button } from 'react-toolbox/lib/button'
import SidebarMenu from './sidebar-menu'

import '../../css/bottom-panel.less'

export default class BottomPanel extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      sidebarActive: false
    }

    this.toggleSidebar = this.toggleSidebar.bind(this)
    this.togglePlayPause = this.togglePlayPause.bind(this)
    this.handleCrossSectionDrawingChange = this.handleCrossSectionDrawingChange.bind(this)
    this.handleCrossSectionViewChange = this.handleChange.bind(this, 'showCrossSectionView')
  }

  get options () {
    return this.props.options
  }

  get drawCrossSectionLabel () {
    return this.options.interaction === 'none' ? 'Draw a cross section line' : 'Finish drawing'
  }

  get openCrossSectionDisabled () {
    return !this.options.crossSectionAvailable
  }

  get playPauseIcon () {
    return this.options.playing ? 'pause' : 'play_arrow'
  }

  togglePlayPause () {
    const { onOptionChange, options } = this.props
    onOptionChange('playing', !options.playing)
  }

  handleChange (name, value) {
    const { onOptionChange } = this.props
    onOptionChange(name, value)
  }

  handleCrossSectionDrawingChange () {
    const { onOptionChange, options } = this.props
    onOptionChange('interaction', options.interaction === 'none' ? 'crossSection' : 'none')
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
            icon={this.playPauseIcon}
            floating primary mini
            onClick={this.togglePlayPause}
          />
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
        <Button icon='menu' onClick={this.toggleSidebar} floating mini />
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} onOptionChange={onOptionChange} options={options} />
      </div>
    )
  }
}
