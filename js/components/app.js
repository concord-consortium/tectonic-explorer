import React from 'react'
import Plates from './plates'
import Authoring from './authoring'
import IndexPage from './index-page'
import { getURLParam } from '../utils'

const authoring = getURLParam('authoring')
const preset = getURLParam('preset')
const planetWizard = getURLParam('planetWizard')
const modelId = getURLParam('modelId')

const App = () => {
  if (authoring) {
    return <Authoring />
  } else if (preset || modelId || planetWizard) {
    return <Plates />
  }
  return <IndexPage />
}

export default App
