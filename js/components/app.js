import React from 'react'
import Plates from './plates'
import IndexPage from './index-page'
import { getURLParam } from '../utils'

const preset = getURLParam('preset')
const authoring = getURLParam('authoring')

const App = () => (
  preset || authoring ? <Plates /> : <IndexPage />
)

export default App
