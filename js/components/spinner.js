import React, { PureComponent } from 'react'

import '../../css/spinner.less'

export default class Spinner extends PureComponent {
  render () {
    return (
      <div className='spinner-container'>
        <svg className='spinner'>
          <circle className='path' cx='50' cy='50' r='20' fill='none' strokeWidth='4' strokeMiterlimit='10' />
        </svg>
      </div>
    )
  }
}
