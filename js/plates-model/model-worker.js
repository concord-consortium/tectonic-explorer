import presets from '../presets'
import modelOutput from './model-output'
import Model from './model'

let model = null
let newInput = null
let input = {}

function workerFunction () {
  setTimeout(workerFunction, 0)
  // Note that it can be optimized later in case of need. We could compare newInput with old input values and decide
  // which output values need to be recalculated. But for now it's fine to always recalculate the whole output.
  let recalcOutput = false
  if (newInput) {
    input = newInput
    newInput = null
    recalcOutput = true
  }
  if (input.playing) {
    model.step()
    recalcOutput = true
  }
  if (recalcOutput) {
    const data = modelOutput(model, input)
    // postMessage let you specify "transferable objects". Those objects won't be serialized, but passed by reference
    // instead. It's possible to do it only for a few object types (e.g. ArrayBuffer).
    const transferableObjects = []
    data.plates.forEach(plate => {
      const fields = plate.fields
      if (fields) {
        transferableObjects.push(fields.id.buffer)
        transferableObjects.push(fields.elevation.buffer)
      }
    })
    postMessage({ type: 'output', data }, transferableObjects)
  }
}

onmessage = function modelWorkerMsgHandler (event) {
  const data = event.data
  if (data.type === 'load') {
    model = new Model(data.imgData, presets[data.presetName].init)
    newInput = data.input
  } else if (data.type === 'input') {
    newInput = data.input
  }
}

workerFunction()
