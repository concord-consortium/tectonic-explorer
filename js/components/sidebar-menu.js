import React, { PureComponent } from 'react'
import { Sidebar } from 'react-toolbox'
import { IconButton } from 'react-toolbox/lib/button'
import { List, ListSubHeader, ListCheckbox } from 'react-toolbox/lib/list'

export default class SidebarMenu extends PureComponent {
  constructor (props) {
    super(props)

    this.toggleWireframe = this.toggleOption.bind(this, 'wireframe')
    this.toggleVelocities = this.toggleOption.bind(this, 'renderVelocities')
  }

  get options () {
    return this.props.options
  }

  handleChange (name, value) {
    const {onOptionChange} = this.props
    onOptionChange(name, value)
  }

  toggleOption (name) {
    const {onOptionChange} = this.props
    onOptionChange(name, !this.options[name])
  }

  render () {
    const {active, onClose} = this.props
    const options = this.options
    return (
      <Sidebar pinned={active} type='right' className='sidebar'>
        <IconButton icon='close' onClick={onClose} />
        <List>
          <ListSubHeader caption='Configuration' />
          <ListCheckbox caption='Velocity arrows' legend='Show plate motion'
            checked={options.renderVelocities} onChange={this.toggleVelocities} />
          <ListCheckbox caption='Wireframe' legend='See through the plate surface'
            checked={options.wireframe} onChange={this.toggleWireframe} />
        </List>
      </Sidebar>
    )
  }
}
