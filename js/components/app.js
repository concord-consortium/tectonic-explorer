import React from 'react'
import Plates from './plates'
import IndexPage from './index-page'
import { getURLParam } from '../utils'

const preset = getURLParam('preset')
const planetWizard = getURLParam('planetWizard')

const App = () => (
  preset || planetWizard ? <Plates /> : <IndexPage />
)

export default App
