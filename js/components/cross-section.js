import React, { PureComponent } from 'react'
import CrossSectionSegment from './cross-section-segment'
import config from '../config'

import '../../css/cross-section.less'

const SKY_HEIGHT = 30 // px
const SEGMENT_HEIGHT = 200 // px
const SEA_LEVEL = SKY_HEIGHT + normalizeElevation(0.5)
const WIDTH_SCALE = 0.2 // px per km

function normalizeElevation (elevation) {
  return SEGMENT_HEIGHT * (1 - ((elevation - config.subductionMinElevation) / (1 - config.subductionMinElevation)))
}

function crossSectionWidth (data) {
  let maxDist = -Infinity
  data.forEach(plateData => {
    const lastPoint = plateData[plateData.length - 1]
    if (lastPoint && lastPoint.dist > maxDist) {
      maxDist = lastPoint.dist
    }
  })
  return maxDist * WIDTH_SCALE
}

export default class CrossSection extends PureComponent {
  renderSegments (plateData) {
    const result = []
    for (let i = 0; i < plateData.length - 1; i += 1) {
      const p1 = plateData[i]
      const p2 = plateData[i + 1]
      result.push(
        <CrossSectionSegment key={i} p1={p1} p2={p2} normalizeElevation={normalizeElevation}
          height={SEGMENT_HEIGHT} widthScale={WIDTH_SCALE} />
      )
    }
    return result
  }

  render () {
    const {data} = this.props
    return (
      <div className='cross-section'>
        <div className='container' style={{width: crossSectionWidth(data)}}>
          <div className='sky' style={{top: 0, height: SEA_LEVEL}} />
          <div className='ocean' style={{top: SEA_LEVEL, height: SEGMENT_HEIGHT - SEA_LEVEL + SKY_HEIGHT}} />
          <div className='plates' style={{top: SKY_HEIGHT}}>
            { data.map((plateData, i) => <div className='plate' key={i}>{ this.renderSegments(plateData) }</div>) }
          </div>
        </div>
      </div>
    )
  }
}
