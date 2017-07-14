import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import { CSSTransitionGroup } from 'react-transition-group'
import FontIcon from 'react-toolbox/lib/font_icon'
import CrossSectionCanvas from './cross-section-canvas'
import config from '../config'

import '../../css/cross-section.less'

const HEIGHT = 200 // px
const SKY_PADDING = 30 // px, area above the dynamic cross section view, filled with sky gradient
const MAX_ELEVATION = 1

export const CROSS_SECTION_TRANSITION_LENGTH = 400 // ms

function scaleX (x) {
  return Math.floor(x * config.crossSectionPxPerKm)
}

function scaleY (y) {
  return Math.floor(HEIGHT * (1 - (y - config.subductionMinElevation) / (MAX_ELEVATION - config.subductionMinElevation)))
}

const SEA_LEVEL = SKY_PADDING + scaleY(0.5) // 0.5 is a sea level in model units

function crossSectionWidth (data) {
  let maxDist = 0
  data.forEach(plateData => {
    const lastPoint = plateData[plateData.length - 1]
    if (lastPoint && lastPoint.dist > maxDist) {
      maxDist = lastPoint.dist
    }
  })
  return scaleX(maxDist)
}

export default class CrossSection extends PureComponent {
  render () {
    const { show, data, onCrossSectionClose } = this.props
    const width = crossSectionWidth(data)
    return (
      <div className='cross-section'>
        <CSSTransitionGroup
          transitionName='slide'
          transitionEnterTimeout={CROSS_SECTION_TRANSITION_LENGTH}
          transitionLeaveTimeout={CROSS_SECTION_TRANSITION_LENGTH}>
          {
            show &&
            <div key='cross-section' className='cross-section-content'>
              <Button className='close-button' onClick={onCrossSectionClose} >
                <FontIcon value='expand_more' /> Hide cross section
              </Button>
              <div className='container' style={{width: width}}>
                <div className='sky' style={{height: SEA_LEVEL}} />
                <div className='ocean' style={{top: SEA_LEVEL, height: HEIGHT - SEA_LEVEL}} />
                <div className='cross-section-canvas' style={{top: SKY_PADDING}}>
                  <CrossSectionCanvas data={data} scaleX={scaleX} scaleY={scaleY} width={width} height={HEIGHT} />
                </div>
              </div>
            </div>
          }
        </CSSTransitionGroup>
      </div>
    )
  }
}
