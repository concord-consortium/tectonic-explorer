import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { topoColor, hueAndElevationToRgb } from '../colormaps'
import { depthToColor } from '../plates-view/earthquake-helpers'
import FontIcon from 'react-toolbox/lib/font_icon'
import { Button } from 'react-toolbox/lib/button'

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
  constructor (props) {
    super(props)
    this.toggleKey = this.toggleKey.bind(this)
  }
  componentDidMount () {
    this.renderCanvases()
  }

  componentDidUpdate () {
    this.renderCanvases()
  }

  renderCanvases () {
    const { colormap, model, key } = this.props.simulationStore
    if (key === true) {
      if (colormap === 'topo') {
        renderTopoScale(this.topoCanvas)
      } else {
        model.plates.forEach(plate => {
          renderPlateScale(this.plateCanvas[plate.id], plate.hue)
        })
      }
    }
  }
  toggleKey () {
    const { setOption, key } = this.props.simulationStore
    setOption('key', !key)
  }
  renderKeyButton () {
    const { key } = this.props.simulationStore
    if (key) {
      return (
        <Button className={css.keyToggleButton} onClick={this.toggleKey} data-test='key-toggle-button'>
          <FontIcon value='clear' />
          <span className='label'>Hide Key</span>
        </Button>
      )
    } else {
      return (
        <Button className={css.keyToggleButton} onClick={this.toggleKey} data-test='key-toggle-button'>
          <FontIcon value='layers' />
          <span className='label'>Key</span>
        </Button>
      )
    }
  }

  render () {
    const { colormap, model, earthquakes, volcanicEruptions, key } = this.props.simulationStore
    this.plateCanvas = {}
    const keyButton = this.renderKeyButton()
    return (
      <div>
        <div className={css.colorKey} data-test='color-key'>
          <div className={css.keyToggleContainer}>
            {keyButton}
          </div>
          {key &&
            <div className={css.colorKeyContainer} data-test='color-key-plates'>
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
          }
          {volcanicEruptions && key &&
            <div className={css.volcanoKeyContainer} data-test='color-key-volcanic-eruptions'>
              <div className={css.volcanoMarker} />
              <div className={css.volcanoLabel}>Volcanic Eruption</div>
            </div>
          }
          {earthquakes && key &&
            <div className={css.earthquakeKeyContainer} data-test='color-key-earthquakes'>
              <table className={css.magnitudeDensity}>
                <tbody>
                  <tr><th colSpan='2'>Earthquake Magnitude</th><th colSpan='2'>Depth</th></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(3)}</td><td className={css.magnitudeText}>3</td><td>{earthquakeColor(0)}</td><td>0-30 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(5)}</td><td className={css.magnitudeText}>5</td><td>{earthquakeColor(0.9)}</td><td>30-100 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(6)}</td><td className={css.magnitudeText}>6</td><td>{earthquakeColor(1.2)}</td><td>100-200 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(7)}</td><td className={css.magnitudeText}>7</td><td>{earthquakeColor(1.7)}</td><td>200-300 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(8)}</td><td className={css.magnitudeText}>8</td><td>{earthquakeColor(2.2)}</td><td>300-500 km</td></tr>
                  <tr><td className={css.earthquakeMagnitudeGraphic}>{circle(9)}</td><td className={css.magnitudeText}>9</td><td>{earthquakeColor(3)}</td><td>> 500 km</td></tr>
                </tbody>
              </table>
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
