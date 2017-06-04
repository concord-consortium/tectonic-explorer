import React, { PureComponent } from 'react'

const PX_PER_KM = 0.2
const HEIGHT = 200 // px

function elevationToCanvasY(point) {
  const elev = point.field.elevation
  return 100 - 100 * elev
}

export default class CrossSectionSegment extends PureComponent {

  get width () {
    const { p1, p2 } = this.props
    const dist = p2.dist - p1.dist // in km
    return dist * PX_PER_KM
  }

  get style () {
    const { p1 } = this.props
    return {
      left: p1.dist * PX_PER_KM
    }
  }

  componentDidMount () {
    this.renderCanvas()
  }

  componentDidUpdate () {
    this.renderCanvas()
  }

  renderCanvas () {
    const { p1, p2 } = this.props
    const width = this.width
    const height = HEIGHT
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = 'black'
    ctx.lineWidth = '3px'
    if (p1.field && p2.field) {
      ctx.beginPath()
      ctx.moveTo(0, elevationToCanvasY(p1))
      ctx.lineTo(width, elevationToCanvasY(p2))
      ctx.stroke()
    }
  }

  render () {
    return (
      <canvas className='cross-section-segment' ref={(c) => { this.canvas = c }} width={this.width} height={HEIGHT} style={this.style} />
    )
  }
}
