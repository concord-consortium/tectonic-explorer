import React from 'react'
import Plates from './plates'
import IndexPage from './index-page'
import { getURLParam } from '../utils'

const preset = getURLParam('preset')
const planetWizard = getURLParam('planetWizard')
const modelId = getURLParam('modelId')

const App = () => (
  preset || modelId || planetWizard ? <Plates /> : <IndexPage />
)

export default App
