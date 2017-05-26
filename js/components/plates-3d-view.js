import React, {PureComponent} from 'react'
import View3D from '../plates-view/view-3d'

export default class Plates3DView extends PureComponent {
  componentDidMount () {
    const { width, height } = this.props
    this.view3d = new View3D({ canvas: this.canvas, width, height })
  }

  setModel (model) {
    this.view3d.setModel(model)
  }

  update () {
    this.view3d.update()
  }

  render () {
    const { height, width } = this.props
    return (
      <div className='plates-3d-view' style={{width, height}}>
        <canvas ref={(c) => { this.canvas = c }} width={width} height={height} />
      </div>
    )
  }
}

Plates3DView.defaultProps = {
  width: 800,
  height: 800
}
