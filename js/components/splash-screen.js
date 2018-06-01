import React, { PureComponent } from 'react'
import splashScreen from '../../images/splash-screen.svg'
import ccLogo from '../../images/cc-logo.png'

const HIDE_AFTER = 2000 // ms
// Note that transition duration has to match value in CSS file.
const TRANSITION_DURATION = 500 // ms
// If window is smaller than provided dimensions, apply scaling.
const MIN_HEIGHT = 700 // px
const MIN_WIDTH = 500 // px

function scale () {
  const height = window.innerHeight
  const width = window.innerWidth
  return Math.min(1, height / MIN_HEIGHT, width / MIN_WIDTH)
}

const mainContainerStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  zIndex: 100000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#fff',
  fontSize: '25px'
}

const fadeOutStyle = {
  opacity: 0,
  transition: 'opacity 500ms'
}

const splashImgStyle = {
  width: '450px',
  marginBottom: '30px',
  display: 'block'
}

const ccLogoStyle = {
  width: '250px',
  verticalAlign: 'middle'
}

export default class SplashScreen extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      show: true,
      fadeOut: false,
      scale: scale()
    }
  }

  componentDidMount () {
    setTimeout(() => {
      this.setState({ fadeOut: true })
    }, HIDE_AFTER - TRANSITION_DURATION)
    setTimeout(() => {
      this.setState({ show: false })
    }, HIDE_AFTER)
  }

  render () {
    const { show, fadeOut, scale } = this.state
    if (!show) {
      return null
    }
    console.log('render')
    return (
      <div style={fadeOut ? Object.assign({}, mainContainerStyle, fadeOutStyle) : mainContainerStyle}>
        <div style={{transform: `scale(${scale}, ${scale})`}}>
          <img style={splashImgStyle} src={splashScreen} />
          <div>a product of <img style={ccLogoStyle} src={ccLogo} /></div>
        </div>
      </div>
    )
  }
}
