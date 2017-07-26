import * as THREE from 'three'
import path from 'path'
import getPixels from 'get-pixels'
import Model from '../js/plates-model/model'

const TIMESTEP = 0.2

function getImageData (src, callback) {
  getPixels(src, (err, pixels) => {
    callback({
      data: pixels.data,
      width: pixels.shape[0],
      height: pixels.shape[1]
    })
  })
}

function initFunc (plates) {
  // const bluePlate = plates[210] // 210 hue
  const yellowPlate = plates[70] // 70 hue
  yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0))
}

function compareModels (m1, m2) {
  expect(m1.stepIdx).toEqual(m2.stepIdx)
  expect(m1.time).toEqual(m2.time)
  expect(m1.plates.length).toEqual(m2.plates.length)
  m1.plates.forEach((p1, i) => {
    const p2 = m2.plates[i]
    comparePlates(p1, p2)
  })
}

function comparePlates (p1, p2) {
  expect(p1.id).toEqual(p2.id)
  expect(p1.quaternion).toEqual(p2.quaternion)
  expect(p1.angularVelocity).toEqual(p2.angularVelocity)
  expect(p1.invMomentOfInertia).toEqual(p2.invMomentOfInertia)
  expect(p1.density).toEqual(p2.density)
  expect(p1.baseColor).toEqual(p2.baseColor)
  expect(p1.fields.size).toEqual(p2.fields.size)
  p1.fields.forEach(f1 => {
    const f2 = p2.fields.get(f1.id)
    compareFields(f1, f2)
  })
  expect(p1.adjacentFields.size).toEqual(p2.adjacentFields.size)
  p1.adjacentFields.forEach(f1 => {
    const f2 = p2.adjacentFields.get(f1.id)
    compareFields(f1, f2)
  })
}

function compareFields (f1, f2) {
  expect(f1.elevation).toEqual(f2.elevation)
  expect(f1.baseElevation).toEqual(f2.baseElevation)
  expect(f1.crustThickness).toEqual(f2.crustThickness)
  expect(f1.baseCrustThickness).toEqual(f2.baseCrustThickness)
  expect(f1.absolutePos).toEqual(f2.absolutePos)
  expect(f1.force).toEqual(f2.force)
  expect(f1.age).toEqual(f2.age)
  expect(f1.mass).toEqual(f2.mass)
  expect(f1.island).toEqual(f2.island)
  expect(f1.isOcean).toEqual(f2.isOcean)
  expect(f1.boundary).toEqual(f2.boundary)
  expect(f1.noCollisionDist).toEqual(f2.noCollisionDist)
  expect(f1.subduction && f1.subduction.progress).toEqual(f2.subduction && f2.subduction.progress)
  expect(f1.draggingPlate && f1.draggingPlate.id).toEqual(f2.draggingPlate && f2.draggingPlate.id)
  compareHelpers(f1.subduction, f2.subduction)
  compareHelpers(f1.orogeny, f2.orogeny)
  compareHelpers(f1.volcanicAct, f2.volcanicAct)
}

function compareHelpers (h1, h2) {
  if (h1 === null && h2 === null) {
    return
  }
  Object.keys(h1).forEach(propName => {
    if (propName !== 'field') {
      expect(h1[propName]).toEqual(h2[propName])
    }
  })
}

let modelImgData = null

beforeAll(done => {
  getImageData(path.join(__dirname, 'testModel.png'), imgData => {
    modelImgData = imgData
    done()
  })
})

test('model serialization', () => {
  const model1 = new Model(modelImgData, initFunc)
  compareModels(Model.deserialize(model1.serialize()), model1)
  // 200 steps so we get to some interesting state.
  for (let i = 0; i < 200; i++) {
    model1.step(TIMESTEP)
  }
  const model2 = Model.deserialize(model1.serialize())
  compareModels(model2, model1)

  // Make sure that all the properties have been serialized and deserialized correctly.
  // Comparision after next 200 steps should ensure that models are identical.
  for (let i = 0; i < 200; i++) {
    // Mock Math.random as model progress depends on it (islands generation).
    Math.random = () => { return i / 200 }
    model1.step(TIMESTEP)
    model2.step(TIMESTEP)
  }
  compareModels(model2, model1)
})
