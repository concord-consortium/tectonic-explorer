import presets from '../presets'
import modelOutput from './model-output'
import Model from './model'

let model = null
let newInput = null
let input = null

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
  if (model.stepIdx < input.targetStepIdx) {
    model.step()
    recalcOutput = true
  }
  if (recalcOutput) {
    const data = modelOutput(model, input)
    const transferableObjects = []
    data.plates.forEach(plate => {
      transferableObjects.push(plate.colors.buffer)
      transferableObjects.push(plate.bumpScale.buffer)
    })
    postMessage({ type: 'output', data })
  }
}

onmessage = function modelWorkerMsgHandler (event) {
  const data = event.data
  if (data.type === 'load') {
    model = new Model(data.imgData, presets[data.presetName].init)
    newInput = data.input
    workerFunction()
  } else if (data.type === 'input') {
    newInput = data.input
  }
}