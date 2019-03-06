import React, { Component } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'
import CrossSection3DView from '../plates-view/cross-section-3d'
import SmallButton from './small-button'

import '../../css/cross-section-3d.less'

export default @inject('simulationStore') @observer class CrossSection3D extends Component {
  constructor (props) {
    super(props)
    this.view = new CrossSection3DView(props.simulationStore.setCrossSectionCameraAngle)
    this.disposeObserver = []

    const store = props.simulationStore
    // Keep observers separate, as we don't want to re-render the whole cross-section each time the camera angle is changed.
    this.disposeObserver.push(autorun(() => {
      this.view.setScreenWidth(store.screenWidth)
      this.view.setCrossSectionData(store.crossSectionOutput, store.crossSectionSwapped)
    }))
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraAngle(store.crossSectionCameraAngle)
    }))
  }

  componentDidMount () {
    this.view3dContainer.appendChild(this.view.domElement)
  }

  componentWillUnmount () {
    this.view.dispose()
    this.disposeObserver.forEach(dispose => dispose())
  }

  render () {
    const { showCrossSectionCameraReset, resetCrossSectionCamera } = this.props.simulationStore
    return (
      <div className='cross-section-3d-view' data-test='3D-view'>
        <div ref={(c) => { this.view3dContainer = c }} />
        {
          showCrossSectionCameraReset &&
          <SmallButton className='cross-section-camera-reset' onClick={resetCrossSectionCamera} icon='settings_backup_restore'
            data-test='camera-reset'>
            Reset cross-section<br />orientation
          </SmallButton>
        }
      </div>
    )
  }
}
