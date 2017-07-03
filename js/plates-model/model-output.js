import getCrossSection from './get-cross-section'

function plateOutput (plate, input) {
  const result = {}
  result.id = plate.id
  result.baseColor = plate.baseColor
  result.density = plate.density
  result.quaternion = plate.quaternion
  result.angularSpeed = plate.angularSpeed
  result.axisOfRotation = plate.axisOfRotation
  result.hotSpot = plate.hotSpot
  const attributes = plate.renderingHelper.calculatePlateColors(input)
  result.colors = attributes.colors
  result.bumpScale = attributes.bumpScale
  // result.colors = new Float32Array(1)
  // result.bumpScale = new Float32Array(1)
  return result
}

export default function modelOutput (model, input) {
  const result = {}
  result.stepIdx = model.stepIdx
  result.plates = model.plates.map(plate => plateOutput(plate, input))
  if (input.crossSectionPoint1 && input.crossSectionPoint2) {
    result.crossSection = getCrossSection(model.plates, input.crossSectionPoint1, input.crossSectionPoint2)
  }
  return result
}
