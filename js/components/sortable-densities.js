import React, {Component} from 'react'
import {render} from 'react-dom'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'
import { Button } from 'react-toolbox/lib/button'

import '../../css/sortable-densities.less'

let key = 0

const SortableItem = SortableElement(({value}) =>
  <li className='density-button-container'>
    <Button className='preset-button density-button' key={key++} label={value}/>
  </li>
)

const SortableList = SortableContainer(({items}) => {
  return (
    <ul>
      {items.map((value, index) => (
        <SortableItem key={`item-${index}`} index={index} value={value} />
      ))}
    </ul>
  )
})

export default class SortableDensites extends Component {
  constructor (props) {
    super(props)
    const { plateIds } = this.props,
          plateInfos = []

    plateIds.forEach(plateId => {
      plateInfos.push({
        id: plateId,
        label: "Plate " + plateId
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
        <SortableList items={this.state.plateInfos.map(plateInfo => plateInfo.label)} onSortEnd={this.onSortEnd} />
        LOW
      </div>
    )
  }
}
