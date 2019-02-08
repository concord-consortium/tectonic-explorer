import React, { PureComponent } from 'react'
import { autorun } from 'mobx'
import { inject, observer } from 'mobx-react'

export default @inject('simulationStore') @observer class TimeDisplay extends PureComponent {
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
