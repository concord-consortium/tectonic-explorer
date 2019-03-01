import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Drawer } from 'react-toolbox/lib/drawer'
import { Button } from 'react-toolbox/lib/button'
import { Dialog } from 'react-toolbox/lib/dialog'
import { List, ListItem, ListCheckbox } from 'react-toolbox/lib/list'
import Slider from 'react-toolbox/lib/slider'
import Dropdown from 'react-toolbox/lib/dropdown'
import config from '../config'

import css from '../../css-modules/sidebar-menu.less'

const INTERACTION_OPTIONS = [
  { value: 'none', label: 'None (camera navigation)' },
  { value: 'crossSection', label: 'Draw a cross section line' },
  { value: 'force', label: 'Assign forces to plates' },
  { value: 'continentDrawing', label: 'Draw continent' },
  { value: 'continentErasing', label: 'Erase continent' },
  { value: 'markField', label: 'Mark field' },
  { value: 'unmarkAllFields', label: 'Remove field markers' },
  { value: 'fieldInfo', label: 'Log field data to browser console' }
]

const COLORMAP_OPTIONS = [
  { value: 'topo', label: 'Topographic' },
  { value: 'plate', label: 'Plate color' },
  { value: 'age', label: 'Crust age' }
]

export default @inject('simulationStore') @observer class SidebarMenu extends Component {
  constructor (props) {
    super(props)

    this.saveModel = this.saveModel.bind(this)
    this.hideSaveDialog = this.hideSaveDialog.bind(this)
    this.toggleEarthquakes = this.toggleOption.bind(this, 'earthquakes')
    this.toggleVolcanicEruptions = this.toggleOption.bind(this, 'volcanicEruptions')
    this.toggleWireframe = this.toggleOption.bind(this, 'wireframe')
    this.toggleVelocities = this.toggleOption.bind(this, 'renderVelocities')
    this.toggleForces = this.toggleOption.bind(this, 'renderForces')
    this.toggleBoundaries = this.toggleOption.bind(this, 'renderBoundaries')
    this.toggleEulerPoles = this.toggleOption.bind(this, 'renderEulerPoles')
    this.toggleLatLongLines = this.toggleOption.bind(this, 'renderLatLongLines')
    this.togglePlateLabels = this.toggleOption.bind(this, 'renderPlateLabels')
    this.changeColormap = this.handleChange.bind(this, 'colormap')
    this.changeInteraction = this.handleChange.bind(this, 'interaction')
    this.changeTimestep = this.handleChange.bind(this, 'timestep')

    this.storedPlayState = true
  }

  get options () {
    return this.props.simulationStore
  }

  get enabledWidgets () {
    return config.sidebar.reduce((res, name) => {
      res[name] = true
      return res
    }, {})
  }

  handleChange (name, value) {
    const { setOption } = this.props.simulationStore
    if (name === 'interaction' && value === 'unmarkAllFields') {
      // Special case, trigger an action using pulldown menu.
      this.props.simulationStore.unmarkAllFields()
    } else {
      setOption(name, value)
    }
  }

  toggleOption (name) {
    const { setOption } = this.props.simulationStore
    setOption(name, !this.options[name])
  }

  getStoredModelText (modelId) {
    let link = window.location.href.split('?')[0] + '?modelId=' + modelId
    return (
      <div>
        <p className={css.saveStateText}>
          Model code:<br />
          <textarea className={css.copyText} id='model-code' value={modelId} readOnly />
        </p>
        <p className={css.saveStateText}>
          Link to model:<br />
          <textarea className={css.copyText} id='model-link' value={link} readOnly />
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
    const { active } = this.props
    const options = this.options
    const enabledWidgets = this.enabledWidgets
    return (
      // insideTree makes testing possible (as Drawer is rendered where Enzyme expects it)
      <Drawer active={active} insideTree type='right' className={css.sidebar} theme={css} data-test='sidebar'>
        <List>
          {
            enabledWidgets.timestep &&
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
            enabledWidgets.interactions &&
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
            enabledWidgets.colormap &&
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
            enabledWidgets.earthquakes &&
            <ListCheckbox caption='Earthquakes' legend='Show earthquakes' data-cy='earthquakes'
              checked={options.earthquakes} onChange={this.toggleEarthquakes} className={css.listItem} />
          }
          {
            enabledWidgets.volcanicEruptions &&
            <ListCheckbox caption='Volcanic eruptions' legend='Show volcanic eruptions'
              checked={options.volcanicEruptions} onChange={this.toggleVolcanicEruptions} className={css.listItem} />
          }
          {
            enabledWidgets.latLongLines &&
            <ListCheckbox caption='Latitude and longitude lines' legend='Geographic coordinate system'
              checked={options.renderLatLongLines} onChange={this.toggleLatLongLines} className={css.listItem} />
          }
          {
            enabledWidgets.plateLabels &&
            <ListCheckbox caption='Plate labels' legend='Show plate numbers'
              checked={options.renderPlateLabels} onChange={this.togglePlateLabels} />
          }
          {
            enabledWidgets.velocityArrows &&
            <ListCheckbox caption='Velocity arrows' legend='Show plate motion'
              checked={options.renderVelocities} onChange={this.toggleVelocities} className={css.listItem} />
          }
          {
            enabledWidgets.forceArrows &&
            <ListCheckbox caption='Force arrows' legend='Show forces acting on a plate'
              checked={options.renderForces} onChange={this.toggleForces} className={css.listItem} />
          }
          {
            enabledWidgets.eulerPoles &&
            <ListCheckbox caption='Euler poles' legend='Show axes of rotation'
              checked={options.renderEulerPoles} onChange={this.toggleEulerPoles} className={css.listItem} />
          }
          {
            enabledWidgets.boundaries &&
            <ListCheckbox caption='Plate boundaries' legend='Highlight plate boundaries'
              checked={options.renderBoundaries} onChange={this.toggleBoundaries} className={css.listItem} />
          }
          {
            enabledWidgets.wireframe &&
            <ListCheckbox caption='Wireframe' legend='See through the plate surface'
              checked={options.wireframe} onChange={this.toggleWireframe} className={css.listItem} />
          }
          <div className={css.buttonContainer}>
            {
              enabledWidgets.save &&
              <Button icon='share' label='Share model' onClick={this.saveModel} disabled={this.options.savingModel} />
            }
          </div>
        </List>
        <Dialog
          actions={this.getSaveDialogActions()}
          active={!!options.lastStoredModel}
          onEscKeyDown={this.hideSaveDialog}
          onOverlayClick={this.hideSaveDialog}
          title='Model saved!'
          data-test='sidebar-dialog'
        >
          { this.getStoredModelText(options.lastStoredModel) }
        </Dialog>
      </Drawer>
    )
  }
}
