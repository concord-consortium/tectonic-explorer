import React, { PureComponent } from 'react'

import '../../css/button.less'

export default class Button extends PureComponent {
  constructor (props) {
    super(props)
    this.handleOnClick = this.handleOnClick.bind(this)
  }

  handleOnClick (event) {
    const { disabled, onClick, name } = this.props
    if (disabled) return
    return onClick(event, name)
  }

  render () {
    const { children, disabled } = this.props
    const className = `button ${disabled ? 'disabled' : ''}`
    return <div className={className} onClick={this.handleOnClick}>{children}</div>
  }
}
