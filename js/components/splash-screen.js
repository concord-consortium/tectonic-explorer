import React, { PureComponent } from 'react'
import splashScreen from '../../images/splash-screen.png'
import ccLogo from '../../images/cc-logo.png'

import css from '../../css-modules/splash-screen.less'

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
