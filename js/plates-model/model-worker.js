import * as THREE from 'three'
import presets from '../presets'
import modelOutput from './model-output'
import Model from './model'

let model = null
let props = {}
let recalcOutput = false

function workerFunction () {
  // Make sure that model doesn't calculate more than 30 steps per second (it can happen on fast machines).
  setTimeout(workerFunction, 33)
  if (props.playing) {
    model.step(props.timestep)
    recalcOutput = true
  }
  if (recalcOutput) {
    const data = modelOutput(model, props)
    // postMessage let you specify "transferable objects". Those objects won't be serialized, but passed by reference
    // instead. It's possible to do it only for a few object types (e.g. ArrayBuffer).
    const transferableObjects = []
    data.plates.forEach(plate => {
      const fields = plate.fields
      if (fields) {
        Object.values(fields).forEach(propertyArray => {
          transferableObjects.push(propertyArray.buffer)
        })
      }
    })
    postMessage({ type: 'output', data }, transferableObjects)
    recalcOutput = false
  }
}

onmessage = function modelWorkerMsgHandler (event) {
  const data = event.data
  if (data.type === 'load') {
    model = new Model(data.imgData, presets[data.presetName].init)
    props = data.props
  } else if (data.type === 'props') {
    props = data.props
  } else if (data.type === 'setHotSpot') {
    const pos = (new THREE.Vector3()).copy(data.props.position)
    const force = (new THREE.Vector3()).copy(data.props.force)
    model.setHotSpot(pos, force)
  } else if (data.type === 'fieldInfo') {
    const pos = (new THREE.Vector3()).copy(data.props.position)
    console.log(model.topFieldAt(pos))
  }
  recalcOutput = true
}

workerFunction()
