import React, { PureComponent } from 'react'

import '../../css/cross-section.less'

export default class CrossSection extends PureComponent {
  render () {
    const { data } = this.props
    return (
      <div className='cross-section'>
        { data }
      </div>
    )
  }
}
