import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import PlanetWizard from './planet-wizard'
import TopBar from './top-bar'
import BottomPanel from './bottom-panel'
import PlanetView from './planet-view'
import CrossSection from './cross-section'
import Benchmark from './benchmark'
import config from '../config'
import { enableShutterbug, disableShutterbug } from '../shutterbug-support'

import '../../css/simulation.less'
import '../../css/react-toolbox-theme.less'

const APP_CLASS_NAME = 'simulation'

@inject('simulationStore') @observer
export default class Simulation extends PureComponent {
  componentDidMount () {
    enableShutterbug(APP_CLASS_NAME)
  }

  componentWillUnmount () {
    disableShutterbug()
  }

  getProgressSpinner (spinnerText) {
    return (
      <div className='spinner'>
        <ProgressBar className='big-spinner' type='circular' mode='indeterminate' multicolor />
        <div>{spinnerText}</div>
      </div>
    )
  }

  render () {
    const { planetWizard, modelState, savingModel } = this.props.simulationStore
    return (
      <div className={APP_CLASS_NAME}>
        <TopBar />
        <PlanetView />
        { modelState === 'loading' && this.getProgressSpinner('The model is being prepared') }
        { savingModel && this.getProgressSpinner('The model is being saved') }
        { config.benchmark && <Benchmark /> }
        <div className='bottom-container'>
          <CrossSection />
          { !planetWizard && <BottomPanel /> }
        </div>
        { planetWizard && <PlanetWizard /> }
      </div>
    )
  }
}
