import React, { PureComponent } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'
import renderCrossSection from '../plates-view/render-cross-section'

import '../../css/cross-section-2d.less'

@inject('simulationStore') @observer
export default class CrossSection2D extends PureComponent {
  componentDidMount () {
    this.disposeObserver = autorun(() => {
      renderCrossSection(this.canvas, this.props.simulationStore.crossSectionOutput.dataFront)
    })
  }

  componentWillUnmount () {
    this.disposeObserver()
  }

  render () {
    const swapped = this.props.simulationStore.crossSectionSwapped
    return (
      <div className='cross-section-2d-view'>
        <div className='canvas-container'>
          <canvas ref={(c) => { this.canvas = c }} />
          <span className='left-label'>{ swapped ? 'P2' : 'P1' }</span>
          <span className='right-label'>{ swapped ? 'P1' : 'P2'}</span>
        </div>
      </div>
    )
  }
}
