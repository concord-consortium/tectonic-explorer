import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'

@inject('simulationStore') @observer
export default class PlateLabel extends PureComponent {
  render () {
    return (
      this.props.simulationStore.hoveredPlate &&
        <div className='plate-label'>Plate {this.props.simulationStore.hoveredPlate.id + 1}</div>
    )
  }
}
