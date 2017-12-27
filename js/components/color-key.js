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

@inject('simulationStore') @observer
export default class ColorKey extends PureComponent {
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
        <div className={css.colorKey}>
          <div className={css.canvases}>
            { colormap === 'topo' &&
              <canvas ref={(c) => { this.topoCanvas = c }} width='25px' height='80px' />
            }
            {
              colormap === 'plate' &&
              model.plates.map(plate => <canvas key={plate.id} ref={(c) => { this.plateCanvas[plate.id] = c }} width='15px' height='80px' />)
            }
          </div>
          <div className={css.labels}>
            <p style={{top: 0}}>8000m</p>
            <p style={{top: 34}}>0m</p>
            <p style={{top: 68}}>-8000m</p>
          </div>
        </div>
      </div>
    )
  }
}
