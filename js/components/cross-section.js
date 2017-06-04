import React, { PureComponent } from 'react'
import CrossSectionSegment from './cross-section-segment'

import '../../css/cross-section.less'

export default class CrossSection extends PureComponent {

  renderSegments (plateData) {
    const result = []
    for (let i = 0; i < plateData.length - 1; i += 1) {
      const p1 = plateData[i]
      const p2 = plateData[i + 1]
      result.push(<CrossSectionSegment p1={p1} p2={p2} key={i} />)
    }
    return result
  }

  render () {
    const { data } = this.props
    return (
      <div className='cross-section'>
        <div className='plates'>
          { data.map((plateData, i) => <div className='plate' key={i}>{ this.renderSegments(plateData) }</div>) }
        </div>
      </div>
    )
  }
}
