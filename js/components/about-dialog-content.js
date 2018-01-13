import React, { PureComponent } from 'react'

import css from '../../css-modules/about-dialog-content.less'

export default class AboutDialogContent extends PureComponent {
  render () {
    return (
      <div className={css.aboutDialog}>
        Plate Tectonics 3D model.
      </div>
    )
  }
}
