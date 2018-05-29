import React, { PureComponent } from 'react'
import splashScreen from '../../images/splash-screen.png'
import ccLogo from '../../images/cc-logo.png'

import css from '../../css-modules/splash-screen.less'

const HIDE_AFTER = 1800 // ms
// Note that transition duration has to match value in CSS file.
const TRANSITION_DURATION = 500 // ms
// If window is smaller than provided dimensions, apply scaling.
const MIN_HEIGHT = 700 // px
const MIN_WIDTH = 500 // px

export default class SplashScreen extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      show: true,
      fadeOut: false,
      scale: 1
    }
    this.onWindowResize = this.onWindowResize.bind(this)
  }

  componentDidMount () {
    setTimeout(() => {
      this.setState({ fadeOut: true })
    }, HIDE_AFTER - TRANSITION_DURATION)
    setTimeout(() => {
      this.setState({ show: false })
    }, HIDE_AFTER)
    window.addEventListener('resize', this.onWindowResize)
    this.onWindowResize()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onWindowResize)
  }

  onWindowResize () {
    const height = window.innerHeight
    const width = window.innerWidth
    this.setState({ scale: Math.min(1, height / MIN_HEIGHT, width / MIN_WIDTH) })
  }

  render () {
    const { show, fadeOut, scale } = this.state
    if (!show) {
      return null
    }
    return (
      <div className={`${css.splashScreen} ${fadeOut ? css.fadeOut : ''}`}>
        <div style={{transform: `scale(${scale}, ${scale})`}}>
          <img className={css.splashImg} src={splashScreen} />
          <div>a product of <img className={css.ccLogo} src={ccLogo} /></div>
        </div>
      </div>
    )
  }
}
