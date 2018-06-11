import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import screenfull from 'screenfull'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import SidebarMenu from './sidebar-menu'
import config from '../config'

import '../../css/bottom-panel.less'

const SIDEBAR_ENABLED = config.sidebar && config.sidebar.length > 0

const MENU_LABEL_MIN_WIDTH = 720 //px

function toggleFullscreen () {
  if (!screenfull.isFullscreen) {
    screenfull.request()
  } else {
    screenfull.exit()
  }
}

@inject('simulationStore') @observer
export default class BottomPanel extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      sidebarActive: false,
      fullscreen: false
    }

    this.toggleSidebar = this.toggleSidebar.bind(this)
    this.togglePlayPause = this.togglePlayPause.bind(this)
    this.fullscreenChange = this.fullscreenChange.bind(this)
  }

  componentDidMount () {
    if (screenfull.enabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange)
    }
  }

  componentWillUnmount () {
    if (screenfull.enabled) {
      document.removeEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange)
    }
  }

  get options () {
    return this.props.simulationStore
  }

  get playPauseIcon () {
    return this.options.playing ? 'pause' : 'play_arrow'
  }

  get playPauseLabel () {
    return this.options.playing ? 'stop' : 'start'
  }

  get menuButton () {
    return this.state.width > MENU_LABEL_MIN_WIDTH
      ? <Button icon='menu' label='Menu' className='menu-button' onClick={this.toggleSidebar} raised primary />
      : <Button icon='menu' className='menu-button' onClick={this.toggleSidebar} floating primary mini />
  }

  get fullscreenIconStyle () {
    return this.state.fullscreen ? 'fullscreen-icon fullscreen' : 'fullscreen-icon'
  }

  fullscreenChange () {
    this.setState({fullscreen: screenfull.isFullscreen})
  }

  togglePlayPause () {
    const { setOption } = this.props.simulationStore
    setOption('playing', !this.options.playing)
  }

  toggleSidebar () {
    const { sidebarActive } = this.state
    this.setState({ sidebarActive: !sidebarActive })
  }

  render () {
    const { sidebarActive } = this.state
    const { reload, restoreSnapshot, restoreInitialSnapshot, stepForward } = this.props.simulationStore
    const options = this.options
    const sidebarAction = sidebarActive ? 'close' : 'menu'
    return (
      <div className='bottom-panel'>
        <img src={ccLogo} className='cc-logo-large' />
        <img src={ccLogoSmall} className='cc-logo-small' />
        <div className='middle-widgets'>
          {
            config.planetWizard &&
            <Button className='inline-widget' onClick={reload}>
              <FontIcon value='replay' />
              <span className='label'>Reload</span>
            </Button>
          }
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={restoreInitialSnapshot}>
            <FontIcon value='skip_previous' />
            <span className='label'>Restart</span>
          </Button>
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={restoreSnapshot}>
            <FontIcon value='fast_rewind' />
            <span className='label'>Step back</span>
          </Button>
          <Button className='inline-widget' onClick={this.togglePlayPause}>
            <FontIcon value={this.playPauseIcon} />
            <span className='label'>{this.playPauseLabel}</span>
          </Button>
          <Button className='inline-widget' onClick={stepForward} disabled={options.playing}>
            <FontIcon value='fast_forward' />
            <span className='label'>Step forward</span>
          </Button>
        </div>
        {
          SIDEBAR_ENABLED && [
            <Button icon={sidebarAction} key='menu-large' label={sidebarAction} className='menu-button large' onClick={this.toggleSidebar} raised primary />,
            <Button icon={sidebarAction} key='menu-small' className='menu-button small' onClick={this.toggleSidebar} floating primary mini />
          ]
        }
        {
          screenfull.enabled &&
          <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title='Toggle Fullscreen' />
        }
        <SidebarMenu active={sidebarActive} />
      </div>
    )
  }
}
