import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { topoColor, hueAndElevationToRgb } from '../colormaps'
import { depthToColor } from '../plates-view/earthquake-helpers'

import css from '../../css-modules/color-key.less'

function colToHex (c) {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`
}

function renderTopoScale (canvas) {
  const width = canvas.width
  const height = canvas.height
  const ctx = canvas.getContext('2d')
  const step = 0.01
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = colToHex(topoColor(-1 + i * 1.5))
    ctx.fillRect(0, (1 - i) * height * 0.5 + height * 0.5, width, height * step)
  }
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = colToHex(topoColor(0.5 + i * 0.5))
    ctx.fillRect(0, (1 - i) * height * 0.5, width, height * step)
  }
}

function renderPlateScale (canvas, hue) {
  const width = canvas.width
  const height = canvas.height
  const ctx = canvas.getContext('2d')
  const step = 0.005
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = colToHex(hueAndElevationToRgb(hue, i))
    ctx.fillRect(0, (1 - i) * height, width, height * step)
  }
}

export default @inject('simulationStore') @observer class ColorKey extends Component {
  componentDidMount () {
    this.renderCanvases()
  }

  componentDidUpdate () {
    this.renderCanvases()
  }

  renderCanvases () {
    const { colormap, model } = this.props.simulationStore
    if (colormap === 'topo') {
      renderTopoScale(this.topoCanvas)
    } else {
      model.plates.forEach(plate => {
        renderPlateScale(this.plateCanvas[plate.id], plate.hue)
      })
    }
  }

  render () {
    const { colormap, model, earthquakes, volcanicEruptions } = this.props.simulationStore
    this.plateCanvas = {}
    return (
      <div>
        <div className={css.colorKey} data-test='color-key'>
          <div className={css.colorKeyContainer}>
            <div className={css.canvases + ' ' + css[colormap]}>
              {colormap === 'topo' &&
                <canvas ref={(c) => { this.topoCanvas = c }} />
              }
              {
                (colormap === 'plate' || colormap === 'age') &&
                model.plates.map(plate => <canvas key={plate.id} ref={(c) => { this.plateCanvas[plate.id] = c }} />)
              }
            </div>
            <div className={css.labels}>
              {
                (colormap === 'topo' || colormap === 'plate') &&
                <div>
                  <p style={{ marginTop: 0 }}>8000m</p>
                  <p style={{ marginTop: 20 }}>0m</p>
                  <p style={{ marginTop: 20 }}>-8000m</p>
                </div>
              }
              {
                colormap === 'age' &&
                <div>
                  <p style={{ marginTop: 0 }}>new crust</p>
                  <p style={{ marginTop: 52 }}>old crust</p>
                </div>
              }
            </div>
          </div>
          {earthquakes &&
            <div className={css.earthquakeKey}>
              <table className={css.magnitudeDensity}>
                <tbody>
                  <tr><th colSpan='2'>Earthquake Magnitude</th><th colSpan='2'>Depth</th></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(3)}</td><td>3</td><td>{earthquakeColor(0)}</td><td>0-30 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(5)}</td><td>5</td><td>{earthquakeColor(0.9)}</td><td>30-100 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(6)}</td><td>6</td><td>{earthquakeColor(1.2)}</td><td>100-200 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(7)}</td><td>7</td><td>{earthquakeColor(1.7)}</td><td>200-300 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(8)}</td><td>8</td><td>{earthquakeColor(2.2)}</td><td>300-500 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(9)}</td><td>9</td><td>{earthquakeColor(3)}</td><td>> 500 km</td></tr>
                </tbody>
              </table>
            </div>
          }
          {volcanicEruptions &&
            <div className={css.volcanoes}>
              <div className={css.volcanoMarker} />
              <div className={css.volcanoLabel}>Volcano</div>
            </div>
          }
        </div>
      </div>
    )
  }
}

function circle (magnitude) {
  return <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'>
    <circle cx='16' cy='16' r={magnitude} stroke='white' fill='rgba(0,0,0,0)' />
  </svg>
}

function earthquakeColor (depth) {
  return <div className={css.earthquakeColor} style={{ backgroundColor: toHexStr(depthToColor(depth)) }} />
}

function toHexStr (d) {
  const hex = Number(d).toString(16)
  return '#000000'.substr(0, 7 - hex.length) + hex
}
