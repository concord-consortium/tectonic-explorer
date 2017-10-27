import React, {Component} from 'react'
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc'
import { hsv } from 'd3-hsv'
import FontIcon from 'react-toolbox/lib/font_icon'

import '../../css/sortable-densities.less'

function hsvToBackground (hsvColor) {
  let rgb = hsv(hsvColor.h, hsvColor.s, hsvColor.v).rgb()
  return {backgroundColor: 'rgb(' + Math.floor(rgb.r) + ', ' + Math.floor(rgb.g) + ', ' + Math.floor(rgb.b) + ')'}
}

const DragHandle = SortableHandle(() => <FontIcon value='menu' className='hamburger-menu'/>)

const SortableItem = SortableElement(({plateInfo}) =>
  <li className='density-button-container' style={hsvToBackground(plateInfo.color)}>
    <div className='shading-box'>
      <DragHandle />
      <div className='density-button'> 
        {plateInfo.label} 
      </div>
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
    const { plateDensities, plateColors } = this.props
    const plateInfos = []

    // Aftering a reload, plate IDs continue to increment
    // Subtracting the smallest ID ensures visible plate numbering starts at 1
    let minId = Object.keys(plateDensities).reduce(function (a, b){ return parseInt(a) < parseInt(b) ? a : b }) - 1
    Object.keys(plateColors).forEach(plateId => {
      plateInfos.push({
        id: plateId,
        color: plateColors[plateId],
        label: 'Plate ' + (plateId - minId)
      })
    })
    plateInfos.sort(function (infoA, infoB) {
      return plateDensities[infoA.id] - plateDensities[infoB.id]
    })
    this.state = {
      plateInfos: plateInfos.slice()
    }
    this.onSortEnd = this.onSortEnd.bind(this)
    this.updateDensities = this.updateDensities.bind(this)
  }
  updateDensities () {
    let newDensities = {}
    this.state.plateInfos.forEach((plateInfo, index) => {
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
      <div>
        <div className='densities'>
          LOW
          <SortableList plateInfos={this.state.plateInfos} onSortEnd={this.onSortEnd} useDragHandle={false}/>
          HIGH
        </div>
        <div className='helper-text'>Click and drag to reorder the plate density.</div>
      </div>
    )
  }
}
