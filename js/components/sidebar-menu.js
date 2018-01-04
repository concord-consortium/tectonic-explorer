import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import { Sidebar } from 'react-toolbox'
import { Button, IconButton } from 'react-toolbox/lib/button'
import { Dialog } from 'react-toolbox/lib/dialog'
import { List, ListItem, ListCheckbox } from 'react-toolbox/lib/list'
import Slider from 'react-toolbox/lib/slider'
import Dropdown from 'react-toolbox/lib/dropdown'
import config from '../config'

import '../../css/sidebar-menu.less'

const INTERACTION_OPTIONS = [
  {value: 'none', label: 'None (camera navigation)'},
  {value: 'crossSection', label: 'Draw a cross section line'},
  {value: 'force', label: 'Assign forces to plates'},
  {value: 'continentDrawing', label: 'Draw continent'},
  {value: 'continentErasing', label: 'Erase continent'},
  {value: 'fieldInfo', label: 'Log field data to browser console'}
]

const COLORMAP_OPTIONS = [
  {value: 'topo', label: 'Topographic'},
  {value: 'plate', label: 'Plate color'}
]

const OPTION_ENABLED = config.sidebar && config.sidebar.reduce((res, name) => {
  res[name] = true
  return res
}, {})

@inject('simulationStore') @observer
export default class SidebarMenu extends PureComponent {
  constructor (props) {
    super(props)

    this.saveModel = this.saveModel.bind(this)
    this.hideSaveDialog = this.hideSaveDialog.bind(this)
    this.toggleWireframe = this.toggleOption.bind(this, 'wireframe')
    this.toggleVelocities = this.toggleOption.bind(this, 'renderVelocities')
    this.toggleForces = this.toggleOption.bind(this, 'renderForces')
    this.toggleBoundaries = this.toggleOption.bind(this, 'renderBoundaries')
    this.toggleEulerPoles = this.toggleOption.bind(this, 'renderEulerPoles')
    this.toggleLatLongLines = this.toggleOption.bind(this, 'renderLatLongLines')
    this.changeColormap = this.handleChange.bind(this, 'colormap')
    this.changeInteraction = this.handleChange.bind(this, 'interaction')
    this.changeTimestep = this.handleChange.bind(this, 'timestep')

    this.storedPlayState = true
  }

  get options () {
    return this.props.simulationStore
  }

  handleChange (name, value) {
    const { setOption } = this.props.simulationStore
    setOption(name, value)
  }

  toggleOption (name) {
    const { setOption } = this.props.simulationStore
    setOption(name, !this.options[name])
  }

  getStoredModelText (modelId) {
    let link = window.location.href.split('?')[0] + '?modelId=' + modelId
    return (
      <div>
        <p className='save-state-text'>
          Model code:<br />
          <textarea className='copy-text' id='model-code' value={modelId} readOnly />
        </p>
        <p className='save-state-text'>
          Link to model:<br />
          <textarea className='copy-text' id='model-link' value={link} readOnly />
        </p>
      </div>
    )
  }

  hideSaveDialog () {
    this.handleChange('playing', this.storedPlayState)
    this.handleChange('lastStoredModel', '')
  }

  copyText (textAreaId) {
    document.querySelector('textarea#' + textAreaId).select()
    document.execCommand('copy')
  }

  getSaveDialogActions () {
    return [
      { label: 'copy code', onClick: this.copyText.bind(this, 'model-code') },
      { label: 'copy link', onClick: this.copyText.bind(this, 'model-link') },
      { label: 'close', onClick: this.hideSaveDialog }
    ]
  }

  saveModel () {
    this.props.simulationStore.saveModel()
    this.storedPlayState = this.options.playing
    this.handleChange('playing', false)
  }

  render () {
    const { active, onClose } = this.props
    const options = this.options
    return (
      <Sidebar pinned={active} type='right' className='sidebar'>
        <IconButton icon='close' onClick={onClose} />
        <List>
          {
            OPTION_ENABLED.timestep &&
            <ListItem
              ripple={false}
              itemContent={
                <div className='list-slider'>
                  <label>Adjust model speed</label>
                  <Slider
                    min={0.01} max={0.4}
                    value={options.timestep}
                    onChange={this.changeTimestep}
                  />
                </div>
              }
            />
          }
          {
            OPTION_ENABLED.interactions &&
            <ListItem
              ripple={false}
              itemContent={
                <Dropdown
                  className='wide-dropdown'
                  label='Select interaction'
                  source={INTERACTION_OPTIONS}
                  value={options.interaction}
                  onChange={this.changeInteraction}
                />
              }
            />
          }
          {
            OPTION_ENABLED.colormap &&
            <ListItem
              ripple={false}
              itemContent={
                <Dropdown
                  label='Select color scheme'
                  source={COLORMAP_OPTIONS}
                  value={options.colormap}
                  onChange={this.changeColormap}
                />
              }
            />
          }
          {
            OPTION_ENABLED.latLongLines &&
            <ListCheckbox caption='Latitude and longitude lines' legend='Geographic coordinate system'
              checked={options.renderLatLongLines} onChange={this.toggleLatLongLines} />
          }
          {
            OPTION_ENABLED.velocityArrows &&
            <ListCheckbox caption='Velocity arrows' legend='Show plate motion'
              checked={options.renderVelocities} onChange={this.toggleVelocities} />
          }
          {
            OPTION_ENABLED.forceArrows &&
            <ListCheckbox caption='Force arrows' legend='Show forces acting on a plate'
              checked={options.renderForces} onChange={this.toggleForces} />
          }
          {
            OPTION_ENABLED.eulerPoles &&
            <ListCheckbox caption='Euler poles' legend='Show axes of rotation'
              checked={options.renderEulerPoles} onChange={this.toggleEulerPoles} />
          }
          {
            OPTION_ENABLED.boundaries &&
            <ListCheckbox caption='Plate boundaries' legend='Highlight plate boundaries'
              checked={options.renderBoundaries} onChange={this.toggleBoundaries} />
          }
          {
            OPTION_ENABLED.wireframe &&
            <ListCheckbox caption='Wireframe' legend='See through the plate surface'
              checked={options.wireframe} onChange={this.toggleWireframe} />
          }
        </List>
        <div className='button-container'>
          {
            OPTION_ENABLED.save &&
            <Button primary raised label={'save'} onClick={this.saveModel} disabled={this.options.savingModel} />
          }
        </div>
        <Dialog
          actions={this.getSaveDialogActions()}
          active={!!options.lastStoredModel}
          onEscKeyDown={this.hideSaveDialog}
          onOverlayClick={this.hideSaveDialog}
          title='Model saved!'
        >
          { this.getStoredModelText(options.lastStoredModel) }
        </Dialog>
      </Sidebar>
    )
  }
}
