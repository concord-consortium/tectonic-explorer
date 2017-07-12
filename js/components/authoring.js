import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import presets from '../presets'

import '../../css/authoring.less'

const AVAILABLE_PRESETS = [
  { name: 'plates2', label: '2 plates' },
  { name: 'plates3', label: '3 plates' },
  { name: 'plates4', label: '4 plates' },
  { name: 'plates5', label: '5 plates' }
]

export default class Authoring extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      step: 'plates'
    }

    this.goToForcesStep = this.goToForcesStep.bind(this)
    this.startSimulation = this.startSimulation.bind(this)
  }

  loadModel (name) {
    const { loadModel, setOption } = this.props
    loadModel(name)
    setOption('interaction', 'generateContinent')
    this.setState({step: 'continents'})
  }

  goToForcesStep () {
    const { setOption } = this.props
    setOption('interaction', 'force')
    this.setState({step: 'forces'})
  }

  startSimulation () {
    const { setOption } = this.props
    setOption('interaction', 'none')
    setOption('colormap', 'topo')
    setOption('playing', true)
    this.setState({step: 'modelStarted'})
  }

  renderPreset (presetInfo) {
    const preset = presets[presetInfo.name]
    const clickHandler = this.loadModel.bind(this, presetInfo.name)
    return (
      <Button className='preset-button' key={presetInfo.name} onClick={clickHandler}>
        <img src={preset.img} />
        <span>{ presetInfo.label }</span>
      </Button>
    )
  }

  render () {
    const { step } = this.state
    if (step === 'modelStarted') {
      return null
    }
    return (
      <div className='authoring'>
        {
          step === 'plates' &&
          <div className='step-1-plates'>
            <h2>Select layout of the planet</h2>
            { AVAILABLE_PRESETS.map(preset => this.renderPreset(preset)) }
          </div>
        }
        {
          step === 'continents' &&
          <div className='step-2-continents'>
            <h2>Click on a plate to add continent</h2>
            <h2>Click <Button primary raised label='next step' onClick={this.goToForcesStep} /> when you are ready</h2>
          </div>
        }
        {
          step === 'forces' &&
          <div className='step-2-continents'>
            <h2>Drag plate to assign velocity</h2>
            <h2>Click <Button primary raised label='finish & play model' onClick={this.startSimulation} /> when you are
              ready</h2>
          </div>
        }
      </div>
    )
  }
}
