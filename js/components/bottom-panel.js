import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import screenfull from 'screenfull'
import ccLogo from '../../images/cc-logo.png'
import ccLogoSmall from '../../images/cc-logo-small.png'
import { Button } from 'react-toolbox/lib/button'
import Checkbox from 'react-toolbox/lib/checkbox'
import Slider from 'react-toolbox/lib/slider'
import FontIcon from 'react-toolbox/lib/font_icon'
import SidebarMenu from './sidebar-menu'
import config from '../config'

import css from '../../css/bottom-panel.less'
import checkTheme from '../../css-modules/bottom-check.less'

const OPTION_ENABLED = config.bottombar.reduce((res, name) => {
  res[name] = true
  return res
}, {})

const MAX_LABEL_LENGTH = 180 //px
const MIN_LABEL_LENGTH = 140 //px
const BOTTOM_UI_WIDTH = 800 //px

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
    this.updateDimensions = this.updateDimensions.bind(this)

    this.toggleWireframe = this.toggleOption.bind(this, 'wireframe')
    this.toggleVelocities = this.toggleOption.bind(this, 'renderVelocities')
    this.toggleForces = this.toggleOption.bind(this, 'renderForces')
    this.toggleBoundaries = this.toggleOption.bind(this, 'renderBoundaries')
    this.toggleEulerPoles = this.toggleOption.bind(this, 'renderEulerPoles')
    this.toggleLatLongLines = this.toggleOption.bind(this, 'renderLatLongLines')
  }

  componentWillMount () {
    this.updateDimensions()
  }

  componentDidMount () {
    if (screenfull.enabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange)
    }
    window.addEventListener("resize", this.updateDimensions)
  }

  componentWillUnmount () {
    if (screenfull.enabled) {
      document.removeEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange)
    }
    window.removeEventListener("resize", this.updateDimensions);
  }

  updateDimensions() {
    this.setState({width: window.innerWidth})
  }

  get toggleOptionsInfo() {
    return {
      'latLongLines': {handler: this.toggleLatLongLines, label: 'Lat/Long Lines', render: 'renderLatLongLines'},
      'velocityArrows': {handler: this.toggleVelocities, label: 'Velocity Arrows', render: 'renderVelocities'},
      'forceArrows': {handler: this.toggleForces, label: 'Force Arrows', render: 'renderForces'},
      'eulerPoles': {handler: this.toggleEulerPoles, label: 'Euler Poles', render: 'renderEulerPoles'},
      'boundaries': {handler: this.toggleBoundaries, label: 'Plate Boundaries', render: 'renderBoundaries'},
      'wireframe': {handler: this.toggleWireframe, label: 'Wireframe', render: 'wireframe'}
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

  get sidebarEnabled () {
    return (config.sidebar.length > 0) || (!this.canFitBottomOptions())
  }

  fullscreenChange () {
    this.setState({fullscreen: screenfull.isFullscreen})
  }

  toggleOption (name) {
    const { setOption } = this.props.simulationStore
    setOption(name, !this.options[name])
  }

  toggleSidebar () {
    const { sidebarActive } = this.state
    this.setState({ sidebarActive: !sidebarActive })
  }

  canFitBottomOptions() {
    return this.state.width > MIN_LABEL_LENGTH + BOTTOM_UI_WIDTH
  }

  bottomOptionsList() {
    if (config.bottombar.length === 0 || !this.canFitBottomOptions() || this.state.sidebarActive) {
      return null
    }

    let isWideList = this.state.width > config.bottombar.length * MAX_LABEL_LENGTH + BOTTOM_UI_WIDTH
    let boxes = config.bottombar.map(option => {
      let info = this.toggleOptionsInfo[option]
      return (info && <Checkbox
        checked={this.options[info.render]}
        label={(isWideList ? "Show " : "") + info.label}
        onChange={info.handler}
        key={option}
        theme={checkTheme}
      />)
    })

    return isWideList
      ? <div className="show-list-large">{boxes}</div>
      : <div className="show-list-small"> <label>Show</label>{boxes} </div>
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
        { this.bottomOptionsList() }
        {
          screenfull.enabled &&
          <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title='Toggle Fullscreen' />
        }
        {
          this.sidebarEnabled &&
          <Button icon='build' className='menu-button' onClick={this.toggleSidebar} floating mini />
        }
        <SidebarMenu active={sidebarActive} onClose={this.toggleSidebar} />
      </div>
    )
  }
}
