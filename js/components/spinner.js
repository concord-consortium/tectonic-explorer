import React, { PureComponent } from 'react'

import '../../css/spinner.less'

export default class Spinner extends PureComponent {
  render () {
    return (
      <div className='spinner-container'>
        <svg className='spinner'>
          <circle className='path' cx='100' cy='100' r='40' fill='none' strokeWidth='6' strokeMiterlimit='10' />
        </svg>
      </div>
    )
  }
}
