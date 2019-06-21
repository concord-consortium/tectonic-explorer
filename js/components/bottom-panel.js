import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import screenfull from 'screenfull'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import { Button } from 'react-toolbox/lib/button'
import SidebarMenu from './sidebar-menu'
import config from '../config'
import StartSVG from '../../images/start.svg'
import StopSVG from '../../images/stop.svg'
import RestartSVG from '../../images/restart.svg'
import ReloadSVG from '../../images/reload.svg'
import StepForwardSVG from '../../images/step-forward.svg'
import StepBackSVG from '../../images/step-back.svg'

import '../../css/bottom-panel.less'

const SIDEBAR_ENABLED = config.sidebar && config.sidebar.length > 0

const MENU_LABEL_MIN_WIDTH = 720 // px

function toggleFullscreen () {
  if (!screenfull.isFullscreen) {
    screenfull.request()
  } else {
    screenfull.exit()
  }
}

export default @inject('simulationStore') @observer class BottomPanel extends Component {
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
    this.setState({ fullscreen: screenfull.isFullscreen })
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
        <img src={ccLogo} className='cc-logo-large' data-test='cc-logo-large' />
        <img src={ccLogoSmall} className='cc-logo-small' data-test='cc-logo-small' />
        <div className='middle-widgets'>
          {
            config.planetWizard &&
            <Button className='inline-widget' onClick={reload} data-test='reload-button'>
              <ReloadSVG />
              <span className='label'>Reload</span>
            </Button>
          }
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={restoreInitialSnapshot}
            data-test='restart-button'>
            <RestartSVG />
            <span className='label'>Restart</span>
          </Button>
          <Button className='inline-widget' disabled={!options.snapshotAvailable} onClick={restoreSnapshot}
            data-test='step-back-button'>
            <StepBackSVG />
            <span className='label'>Step back</span>
          </Button>
          <Button className='inline-widget' onClick={this.togglePlayPause} data-test='playPause-button'>
            { this.options.playing ? <StopSVG /> : <StartSVG /> }
            <span className='label'>{this.playPauseLabel}</span>
          </Button>
          <Button className='inline-widget' onClick={stepForward} disabled={options.playing}
            data-test='step-forward-button'>
            <StepForwardSVG />
            <span className='label'>Step forward</span>
          </Button>
        </div>
        {
          SIDEBAR_ENABLED && [
            <Button icon={sidebarAction} key='menu-large' className='menu-button large' onClick={this.toggleSidebar} raised primary data-test='large-menu-button'>
              { sidebarActive ? 'Close' : 'Menu' }
            </Button>,
            <Button icon={sidebarAction} key='menu-small' className='menu-button small' onClick={this.toggleSidebar} floating primary mini />
          ]
        }
        {
          screenfull.enabled &&
          <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title='Toggle Fullscreen'
            data-test='fullscreen-button' />
        }
        <SidebarMenu active={sidebarActive} />
      </div>
    )
  }
}
