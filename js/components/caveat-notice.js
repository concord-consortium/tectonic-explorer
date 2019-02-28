import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import css from '../../css-modules/caveat-notice.less'

export default @inject('simulationStore') @observer class Caveat extends Component {
  render () {
    const { earthquakes, volcanicEruptions } = this.props.simulationStore
    const caveatDisplay = earthquakes || volcanicEruptions ? css.caveat + ' ' + css.visible : css.caveat

    return (
      <div className={caveatDisplay}>
        <div>
          The earthquakes and volcanic eruptions in this model do not represent actual frequency or duration.
          Because of the timescale of this model, only a very small number of these events are represented to
          highlight where they might occur.
        </div>
      </div>
    )
  }
}
