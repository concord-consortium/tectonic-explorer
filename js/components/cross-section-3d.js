import React, { PureComponent } from 'react'
import CrossSection3DView from '../plates-view/cross-section-3d'
import SmallButton from './small-button'

import '../../css/cross-section-3d.less'

export default class CrossSection3D extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      showCameraResetButton: false
    }
    this.onCameraChange = this.onCameraChange.bind(this)
    this.resetCamera = this.resetCamera.bind(this)

    this.view = new CrossSection3DView(this.viewProps)
  }

  get viewProps () {
    return Object.assign({}, this.props, { onCameraChange: this.onCameraChange })
  }

  componentDidMount () {
    this.view3dContainer.appendChild(this.view.domElement)
  }

  componentDidUpdate () {
    this.view.setProps(this.viewProps)
  }

  componentWillUnmount () {
    this.view.dispose()
  }

  onCameraChange () {
    this.setState({ showCameraResetButton: true })
  }

  resetCamera () {
    this.view.resetCamera()
    this.setState({ showCameraResetButton: false })
  }

  render () {
    const { showCameraResetButton } = this.state
    return (
      <div className='cross-section-3d-view'>
        <div ref={(c) => { this.view3dContainer = c }} />
        {
          showCameraResetButton &&
          <SmallButton className='camera-reset' onClick={this.resetCamera} icon='settings_backup_restore'>
            Reset cross-section<br />orientation
          </SmallButton>
        }
      </div>
    )
  }
}
