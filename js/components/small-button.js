import React, { PureComponent } from 'react'
import FontIcon from 'react-toolbox/lib/font_icon'
import { Button } from 'react-toolbox/lib/button'

import '../../css/react-toolbox-theme.less'

export default class SmallButton extends PureComponent {
  render () {
    const { className, label, icon, onClick } = this.props
    return (
      <Button className={`small-button ${className}`} onClick={onClick}>
        <FontIcon value={icon} />
        <div className='label'>{ label }</div>
      </Button>
    )
  }
}
