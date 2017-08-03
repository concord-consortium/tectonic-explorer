import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'
import App from './components/app'
import * as THREE from 'three'
import initRollbar from './init-rollbar'

initRollbar()

render(<App />, document.getElementById('app'))
// Useful for debugging, e.g. it's possible to create new THREE.Vector3 instances that are used internally.
window.THREE = THREE
