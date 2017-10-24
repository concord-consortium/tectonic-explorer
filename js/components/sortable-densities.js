import React, {Component} from 'react'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'
import { hsv } from 'd3-hsv'

import '../../css/sortable-densities.less'

let key = 0

function hsvToBackground (hsvColor) {
  let rgb = hsv(hsvColor.h, hsvColor.s, hsvColor.v).rgb()
  return {backgroundColor: 'rgb(' + Math.floor(rgb.r) + ', ' + Math.floor(rgb.g) + ', ' + Math.floor(rgb.b) + ')'}
}

const SortableItem = SortableElement(({plateInfo}) =>
  <li className='density-button-container' style={hsvToBackground(plateInfo.color)}>
    <div className='shading-box'>
      <div className='density-button' key={key++}> {plateInfo.label} </div>
    </div>
  </li>
)

const SortableList = SortableContainer(({plateInfos}) => {
  return (
    <ul>
      {plateInfos.map((plateInfo, index) => (
        <SortableItem key={`item-${index}`} index={index} plateInfo={plateInfo} />
      ))}
    </ul>
  )
})

export default class SortableDensites extends Component {
  constructor (props) {
    super(props)
    const { plates } = this.props
    const plateInfos = []

    // Aftering a reload, plate IDs continue to increment
    // Subtracting the smallest ID ensures visible plate numbering starts at 1
    let minId = plates.map(plate => plate.id).sort()[0] - 1
    plates.forEach(plate => {
      plateInfos.push({
        id: plate.id,
        color: plate.baseColor,
        label: 'Plate ' + (plate.id - minId)
      })
    })
    this.state = {
      plateInfos: plateInfos.slice()
    }
    this.onSortEnd = this.onSortEnd.bind(this)
    this.updateDensities = this.updateDensities.bind(this)
  }
  componentDidMount () {
    this.updateDensities()
  }
  updateDensities () {
    let newDensities = {}
    // Plates are arranged in descending order, so reverse to assign densities in ascending order
    this.state.plateInfos.slice().reverse().forEach((plateInfo, index) => {
      newDensities[plateInfo.id] = index
    })
    this.props.setDensities(newDensities)
  }
  onSortEnd ({oldIndex, newIndex}) {
    this.setState({
      plateInfos: arrayMove(this.state.plateInfos, oldIndex, newIndex)
    })
    this.updateDensities()
  }
  render () {
    return (
      <div className='densities'>
        HIGH
        <SortableList plateInfos={this.state.plateInfos} onSortEnd={this.onSortEnd} />
        LOW
      </div>
    )
  }
}
