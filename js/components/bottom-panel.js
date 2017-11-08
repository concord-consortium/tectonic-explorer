import React, { PureComponent } from 'react'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import SidebarMenu from './sidebar-menu'
import config from '../config'

import '../../css/bottom-panel.less'

export default class BottomPanel extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      sidebarActive: false
    }

    this.toggleSidebar = this.toggleSidebar.bind(this)
    this.togglePlayPause = this.togglePlayPause.bind(this)
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
    const { onOptionChange, onReload, onRestoreSnapshot, onRestoreInitialSnapshot, onSaveModel,
      lastStoredModel, onStepForward } = this.props
    const options = this.options
    const sidebarEnabled = config.sidebar && config.sidebar.length > 0
    return (
      <div className='bottom-panel'>
        <img src={ccLogo} className='cc-logo-large' />
        <img src={ccLogoSmall} className='cc-logo-small' />
        <div className='middle-widgets'>
          {
            onReload &&
            <Button className='inline-widget' onClick={onReload}>
              <FontIcon value='replay' />
              <span className='label'>Reload</span>
            </Button>
          }
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={onRestoreInitialSnapshot}>
            <FontIcon value='skip_previous' />
            <span className='label'>Restart</span>
          </Button>
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={onRestoreSnapshot}>
            <FontIcon value='fast_rewind' />
            <span className='label'>Step back</span>
          </Button>
          <Button className='inline-widget' onClick={this.togglePlayPause}>
            <FontIcon value={this.playPauseIcon} />
            <span className='label'>{this.playPauseLabel}</span>
          </Button>
          <Button className='inline-widget' onClick={onStepForward} disabled={options.playing}>
            <FontIcon value='fast_forward' />
            <span className='label'>Step forward</span>
          </Button>
        </div>
        {
          sidebarEnabled &&
          <Button icon='menu' className='menu-button float-right' onClick={this.toggleSidebar} floating mini />
        }
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} onOptionChange={onOptionChange}
          options={options} onSaveModel={onSaveModel} lastStoredModel={lastStoredModel} />
      </div>
    )
  }
}
