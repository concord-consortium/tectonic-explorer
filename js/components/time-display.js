import React, { Component } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'

@inject('simulationStore') @observer
export default class TimeDisplay extends Component {
  componentDidMount () {
    // Optimization, don't use React rendering as this is updated 60 times per second.
    this.disposeObserver = autorun(() => {
      this.timeValue.textContent = this.props.simulationStore.model.time
    })
  }

  componentWillUnmount () {
    this.disposeObserver()
  }

  render () {
    return (
      <div className='time-display' data-test='time-display'>
        <span ref={s => { this.timeValue = s }}>0</span> million years
      </div>
    )
  }
}
