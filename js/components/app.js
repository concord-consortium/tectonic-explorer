import React from 'react'
import Plates from './plates'
import IndexPage from './index-page'
import { getURLParam } from '../utils'

const preset = getURLParam('preset')

const App = () => (
  preset ? <Plates preset={preset} /> : <IndexPage />
)

export default App
