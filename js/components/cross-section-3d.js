import React, { PureComponent } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'
import CrossSection3DView from '../plates-view/cross-section-3d'
import SmallButton from './small-button'

import '../../css/cross-section-3d.less'

@inject('simulationStore') @observer
export default class CrossSection3D extends PureComponent {
  constructor (props) {
    super(props)
    this.view = new CrossSection3DView(props.simulationStore.setCrossSectionCameraAngle)
    this.disposeObserver = []
    // Keep observers separate, as we don't want to re-render the whole cross section each time the camera angle is changed.
    this.disposeObserver.push(autorun(() => {
      this.view.setScreenWidth(props.simulationStore.screenWidth)
      this.view.setCrossSectionData(props.simulationStore.crossSectionOutput, props.simulationStore.crossSectionSwapped)
    }))
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraAngle(props.simulationStore.crossSectionCameraAngle)
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
      <div className='cross-section-3d-view'>
        <div ref={(c) => { this.view3dContainer = c }} />
        {
          showCrossSectionCameraReset &&
          <SmallButton className='cross-section-camera-reset' onClick={resetCrossSectionCamera} icon='settings_backup_restore'>
            Reset cross-section<br />orientation
          </SmallButton>
        }
      </div>
    )
  }
}
