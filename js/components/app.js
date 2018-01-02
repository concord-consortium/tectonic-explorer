import React from 'react'
import { Provider } from 'mobx-react'
import Simulation from './simulation'
import Authoring from './authoring'
import IndexPage from './index-page'
import { getURLParam } from '../utils'
import simulationStore from '../stores/simulation-store'

const authoring = getURLParam('authoring')
const preset = getURLParam('preset')
const planetWizard = getURLParam('planetWizard')
const modelId = getURLParam('modelId')

const App = () => {
  if (authoring) {
    return <Authoring />
  } else if (preset || modelId || planetWizard) {
    return (
      <Provider simulationStore={simulationStore}>
        <Simulation />
      </Provider>
    )
  }
  return <IndexPage />
}

export default App
