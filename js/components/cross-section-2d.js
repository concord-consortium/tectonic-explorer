import React, { Component } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'
import renderCrossSection from '../plates-view/render-cross-section'

import '../../css/cross-section-2d.less'

@inject('simulationStore') @observer
export default class CrossSection2D extends Component {
  componentDidMount () {
    this.disposeObserver = autorun(() => {
      const store = this.props.simulationStore
      renderCrossSection(this.canvas, store.crossSectionOutput.dataFront)
    })
  }

  componentWillUnmount () {
    this.disposeObserver()
  }

  render () {
    const swapped = this.props.simulationStore.crossSectionSwapped
    return (
      <div className='cross-section-2d-view' data-test='2D-view'>
        <div className='canvas-container' data-test='canvas'>
          <canvas ref={(c) => { this.canvas = c }} />
          <span className='left-label' data-test='2D-left-label'>{ swapped ? 'P2' : 'P1' }</span>
          <span className='right-label' data-test='2D-right-label'>{ swapped ? 'P1' : 'P2'}</span>
        </div>
      </div>
    )
  }
}
