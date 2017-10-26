import * as THREE from 'three'
import presets from '../presets'
import modelOutput from './model-output'
import plateDrawTool from './plate-draw-tool'
import Model from './model'
import config from '../config'

const MAX_SNAPSHOTS_COUNT = 10

let model = null
let props = {}
let forceRecalcOutput = false
let initialSnapshot = null
const snapshots = []
const labeledSnapshots = {}

function workerFunction () {
  // Make sure that model doesn't calculate more than 30 steps per second (it can happen on fast machines).
  setTimeout(workerFunction, 33)
  if (!model) {
    return
  }
  let recalcOutput = false
  if (props.playing) {
    if (config.snapshotInterval && model.stepIdx % config.snapshotInterval === 0) {
      if (model.stepIdx === 0) {
        initialSnapshot = model.serialize()
      } else {
        snapshots.push(model.serialize())
        while (snapshots.length > MAX_SNAPSHOTS_COUNT) {
          snapshots.shift()
        }
      }
    }
    model.step(props.timestep)
    recalcOutput = true
  }
  if (recalcOutput || forceRecalcOutput) {
    const data = modelOutput(model, props, forceRecalcOutput)
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
    forceRecalcOutput = false
  }
}

onmessage = function modelWorkerMsgHandler (event) {
  const data = event.data
  if (data.type === 'load') {
    // Export model to global m variable for convenience.
    self.m = model = new Model(data.imgData, presets[data.presetName].init)
    props = data.props
  } else if (data.type === 'unload') {
    self.m = model = null
    initialSnapshot = null
    snapshots.length = 0
    postMessage({ type: 'output', data: modelOutput(null) })
  } else if (data.type === 'props') {
    props = data.props
  } else if (data.type === 'setHotSpot') {
    const pos = (new THREE.Vector3()).copy(data.props.position)
    const force = (new THREE.Vector3()).copy(data.props.force)
    model.setHotSpot(pos, force)
  } else if (data.type === 'setDensities') {
    model.setDensities(data.densities)
  } else if (data.type === 'fieldInfo') {
    const pos = (new THREE.Vector3()).copy(data.props.position)
    console.log(model.topFieldAt(pos))
  } else if (data.type === 'drawContinent' || data.type === 'eraseContinent') {
    const pos = (new THREE.Vector3()).copy(data.props.position)
    const clickedField = model.topFieldAt(pos)
    if (clickedField) {
      plateDrawTool(clickedField.plate, clickedField.id, data.type === 'drawContinent' ? 'continent' : 'ocean')
    }
  } else if (data.type === 'restoreSnapshot') {
    let serializedModel
    if (snapshots.length === 0) {
      serializedModel = initialSnapshot
    } else {
      serializedModel = snapshots.pop()
      if (snapshots.length > 0 && model.stepIdx < serializedModel.stepIdx + 20) {
        // Make sure that it's possible to step more than just one step. Restore even earlier snapshot if the last
        // snapshot is very close the current model state. It's simialr to << buttons in audio players - usually
        // it just goes to the beginning of a song, but if you hit it again quickly, it will switch to the previous song.
        serializedModel = snapshots.pop()
      }
    }
    self.m = model = Model.deserialize(serializedModel)
  } else if (data.type === 'restoreInitialSnapshot') {
    self.m = model = Model.deserialize(initialSnapshot)
    snapshots.length = 0
  } else if (data.type === 'takeLabeledSnapshot') {
    labeledSnapshots[data.label] = model.serialize()
  } else if (data.type === 'restoreLabeledSnapshot') {
    let storedModel = labeledSnapshots[data.label]
    if (storedModel) {
      self.m = model = Model.deserialize(storedModel)
      delete labeledSnapshots[data.label]
    }
  }
  forceRecalcOutput = true
}

workerFunction()
