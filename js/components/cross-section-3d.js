import React, { PureComponent } from 'react'
import CrossSection3DView from '../plates-view/cross-section-3d'

export default class CrossSection3D extends PureComponent {
  componentDidMount () {
    this.view = new CrossSection3DView()
    this.view3dContainer.appendChild(this.view.domElement)
  }

  componentDidUpdate (prevProps) {
    const { data, swapped } = this.props
    if (data !== prevProps.data || swapped !== prevProps.swapped) {
      this.view.setCrossSectionData(data, swapped)
    }
  }

  render () {
    return (
      <div className='cross-section-3d-view' ref={(c) => { this.view3dContainer = c }} />
    )
  }
}
