import React, { PureComponent } from 'react'
import * as THREE from 'three'
import config from '../config'

const OCEANIC_CRUST_COL = '#27374f'
const CONTINENTAL_CRUST_COL = '#643d0c'
const LITHOSPHERE_COL = '#666'
const MANTLE_COL = '#033f19'

export default class CrossSectionCanvas extends PureComponent {
  componentDidMount () {
    this.renderCanvas()
  }

  componentDidUpdate () {
    this.renderCanvas()
  }

  fillPath (color, p1, p2, p3, p4) {
    const { scaleX, scaleY } = this.props
    const ctx = this.canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(scaleX(p1.x), scaleY(p1.y))
    ctx.lineTo(scaleX(p2.x), scaleY(p2.y))
    ctx.lineTo(scaleX(p3.x), scaleY(p3.y))
    ctx.lineTo(scaleX(p4.x), scaleY(p4.y))
    ctx.closePath()
    ctx.fill()
  }

  debugInfo (p1, p2, info) {
    const { scaleX, scaleY } = this.props
    const ctx = this.canvas.getContext('2d')
    ctx.strokeStyle = 'black'
    ctx.beginPath()
    ctx.moveTo(scaleX(p1.x), scaleY(p1.y))
    ctx.lineTo(scaleX(p2.x), scaleY(p2.y))
    ctx.stroke()
    ctx.fillStyle = 'black'
    info.forEach((text, idx) => {
      ctx.fillText(text, scaleX(p1.x) + 5, scaleY(p1.y) + 10 + 10 * idx)
    })
  }

  renderChunk (chunkData) {
    for (let i = 0; i < chunkData.length - 1; i += 1) {
      const x1 = chunkData[i].dist
      const x2 = chunkData[i + 1].dist
      const f1 = chunkData[i].field
      const f2 = chunkData[i + 1].field
      // Top of the crust
      const t1 = new THREE.Vector2(x1, f1.elevation)
      const t2 = new THREE.Vector2(x2, f2.elevation)
      // Bottom of the crust, top of the lithosphere
      const c1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness)
      const c2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness)
      // Bottom of the lithosphere, top of the mantle
      const l1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness - f1.lithosphereThickness)
      const l2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness - f2.lithosphereThickness)
      // Bottom of the cross section and mantle
      const b1 = new THREE.Vector2(x1, config.subductionMinElevation)
      const b2 = new THREE.Vector2(x2, config.subductionMinElevation)
      // Fill crust
      this.fillPath(f1.isOcean && f2.isOcean ? OCEANIC_CRUST_COL : CONTINENTAL_CRUST_COL, t1, t2, c2, c1)
      // Fill lithosphere
      this.fillPath(LITHOSPHERE_COL, c1, c2, l2, l1)
      // Fill mantle
      this.fillPath(MANTLE_COL, l1, l2, b2, b1)
      // Debug info, optional
      if (config.debugCrossSection) {
        this.debugInfo(l1, b1, [i, f1.id, x1.toFixed(1) + ' km'])
      }
    }
  }

  renderCanvas () {
    const { data, width, height } = this.props
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    data.forEach(chunkData => this.renderChunk(chunkData))
  }

  render () {
    const { width, height } = this.props
    return (
      <canvas ref={(c) => { this.canvas = c }} width={width} height={height} />
    )
  }
}
