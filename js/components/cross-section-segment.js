import React, { PureComponent } from 'react'

const LITHOSPHERE_THICKNESS = 0.7

export default class CrossSectionSegment extends PureComponent {
  get width () {
    const { p1, p2, widthScale } = this.props
    const dist = p2.dist - p1.dist // in km
    return Math.round(dist * widthScale)
  }

  get style () {
    const { p1, widthScale } = this.props
    return {
      left: Math.round(p1.dist * widthScale)
    }
  }

  componentDidMount () {
    this.renderCanvas()
  }

  componentDidUpdate () {
    this.renderCanvas()
  }

  renderCanvas () {
    const { p1, p2, height, normalizeElevation } = this.props
    const f1 = p1.field
    const f2 = p2.field || p1.field
    const width = this.width
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    if (f1 && f2) {
      // Crust
      ctx.fillStyle = f1.isOcean ? '#27374f' : '#643d0c'
      ctx.beginPath()
      ctx.moveTo(0, normalizeElevation(f1.elevation))
      ctx.lineTo(width, normalizeElevation(f2.elevation))
      ctx.lineTo(width, normalizeElevation(f2.elevation - f2.crustThickness))
      ctx.lineTo(0, normalizeElevation(f1.elevation - f1.crustThickness))
      ctx.closePath()
      ctx.fill()
      // Lithosphere
      ctx.fillStyle = '#666666'
      ctx.beginPath()
      ctx.moveTo(0, normalizeElevation(f1.elevation - f1.crustThickness))
      ctx.lineTo(width, normalizeElevation(f2.elevation - f2.crustThickness))
      ctx.lineTo(width, normalizeElevation(f2.elevation - f2.crustThickness - LITHOSPHERE_THICKNESS))
      ctx.lineTo(0, normalizeElevation(f1.elevation - f1.crustThickness - LITHOSPHERE_THICKNESS))
      ctx.closePath()
      ctx.fill()
      // Mantle
      ctx.fillStyle = '#860100'
      ctx.beginPath()
      ctx.moveTo(0, normalizeElevation(f1.elevation - f1.crustThickness - LITHOSPHERE_THICKNESS))
      ctx.lineTo(width, normalizeElevation(f2.elevation - f2.crustThickness - LITHOSPHERE_THICKNESS))
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()
    }
  }

  render () {
    const { height } = this.props
    return (
      <canvas className='cross-section-segment' ref={(c) => { this.canvas = c }}
        width={this.width}
        height={height}
        style={this.style}
      />
    )
  }
}
