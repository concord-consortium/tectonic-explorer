import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import { topoColor, hueAndElevationToRgb } from '../colormaps'

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

export default @inject('simulationStore') @observer class ColorKey extends PureComponent {
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
    const { colormap, model } = this.props.simulationStore
    this.plateCanvas = {}
    return (
      <div>
        <div className={css.colorKey} data-test='color-key'>
          <div className={css.canvases + ' ' + css[colormap]}>
            { colormap === 'topo' &&
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
      </div>
    )
  }
}
