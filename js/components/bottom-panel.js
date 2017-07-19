import React, { PureComponent } from 'react'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
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
    this.reload = this.reload.bind(this)
  }

  get options () {
    return this.props.options
  }

  get playPauseIcon () {
    return this.options.playing ? 'pause' : 'play_arrow'
  }

  get playPauseLabel () {
    return this.options.playing ? 'stop' : 'start'
  }

  reload () {
    const { onReload } = this.props
    onReload()
  }

  togglePlayPause () {
    const { onOptionChange, options } = this.props
    onOptionChange('playing', !options.playing)
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
        <img src={ccLogo} className='cc-logo-large' />
        <img src={ccLogoSmall} className='cc-logo-small' />
        <div className='middle-widgets'>
          <Button
            className='inline-widget'
            icon='replay'
            label='reload'
            onClick={this.reload}
          />
          <Button
            className='inline-widget'
            icon={this.playPauseIcon}
            label={this.playPauseLabel}
            onClick={this.togglePlayPause}
          />
        </div>
        <Button icon='menu' className='menu-button float-right' onClick={this.toggleSidebar} floating mini />
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} onOptionChange={onOptionChange} options={options} />
      </div>
    )
  }
}
