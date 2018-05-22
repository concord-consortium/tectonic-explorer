import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import screenfull from 'screenfull'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import { Button } from 'react-toolbox/lib/button'
import Checkbox from 'react-toolbox/lib/checkbox';
import Slider from 'react-toolbox/lib/slider'
import FontIcon from 'react-toolbox/lib/font_icon'
import SidebarMenu from './sidebar-menu'
import config from '../config'

import css from '../../css/bottom-panel.less'

const SIDEBAR_ENABLED = config.sidebar && config.sidebar.length > 0

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
    this.togglePlayPause = this.toggleOption.bind(this, 'playing')
    this.fullscreenChange = this.fullscreenChange.bind(this)
    this.changeTimestep = this.changeTimestep.bind(this)
    this.toggleBoundaries = this.toggleOption.bind(this, 'renderBoundaries')
    this.toggleForces = this.toggleOption.bind(this, 'renderForces')
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

  get fullscreenIconStyle () {
    return this.state.fullscreen ? 'fullscreen-icon fullscreen' : 'fullscreen-icon'
  }

  fullscreenChange () {
    this.setState({fullscreen: screenfull.isFullscreen})
  }

  changeTimestep(value) {
    const { setOption } = this.props.simulationStore
    setOption('timestep', value)
  }

  toggleOption (name) {
    const { setOption } = this.props.simulationStore
    setOption(name, !this.options[name])
  }

  toggleSidebar () {
    const { sidebarActive } = this.state
    this.setState({ sidebarActive: !sidebarActive })
  }

  render () {
    const { sidebarActive } = this.state
    const { reload, restoreSnapshot, restoreInitialSnapshot, stepForward } = this.props.simulationStore
    const options = this.options
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
        <div className='time-slider'>
          <label>Adjust model speed</label>
          <Slider
            min={0.01} max={0.4}
            value={options.timestep}
            onChange={this.changeTimestep}
          />
        </div>
        <div className='show-list'>
          <label>Show</label>
          <Checkbox
            checked={options.renderBoundaries}
            label="boundaries"
            onChange={this.toggleBoundaries}
            theme={css}
          />
          <Checkbox
            checked={options.renderForces}
            label="forces"
            onChange={this.toggleForces}
            theme={css}
          />
        </div>
        {
          screenfull.enabled &&
          <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title='Toggle Fullscreen' />
        }
        {
          SIDEBAR_ENABLED &&
          <Button icon='menu' className='menu-button' onClick={this.toggleSidebar} floating mini />
        }
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} />
      </div>
    )
  }
}
