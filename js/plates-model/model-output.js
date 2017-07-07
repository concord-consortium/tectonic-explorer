import getCrossSection from './get-cross-section'

// Sending data back to main thread is expensive. Don't send data too often and also try to distribute data
// among different messages, not to create one which would be very big (that's why offset is used).
const UPDATE_INTERVAL = {
  fields: 10,
  crossSection: 10
}
const UPDATE_OFFSET = {
  fields: 0,
  crossSection: 5
}
function shouldUpdate (name, stepIdx) {
  return (stepIdx + UPDATE_OFFSET[name]) % UPDATE_INTERVAL[name] === 0
}

function plateOutput (plate, props, stepIdx) {
  const result = {}
  result.id = plate.id
  result.quaternion = plate.quaternion
  if (stepIdx < 2) {
    // Those properties are necessary only when proxy models are initialized, they don't change later.
    // stepIdx < 2 as it can be equal to 0 or 1, depending if model is playing or not.
    result.baseColor = plate.baseColor
    result.density = plate.density
  }
  if (props.renderEulerPoles) {
    result.angularSpeed = plate.angularSpeed
    result.axisOfRotation = plate.axisOfRotation
  }
  if (props.renderHotSpots) {
    result.hotSpot = plate.hotSpot
  }
  if (shouldUpdate('fields', stepIdx)) {
    result.fields = {
      id: new Uint32Array(plate.fields.size),
      elevation: new Float32Array(plate.fields.size)
    }
    const fields = result.fields
    if (props.renderBoundaries) {
      fields.boundary = new Int8Array(plate.fields.size)
    }
    let idx = 0
    plate.fields.forEach(field => {
      fields.id[idx] = field.id
      fields.elevation[idx] = field.elevation
      if (props.renderBoundaries) {
        fields.boundary[idx] = field.boundary
      }
      idx += 1
    })
  }
  return result
}

export default function modelOutput (model, props) {
  const result = {}
  result.stepIdx = model.stepIdx
  result.plates = model.plates.map(plate => plateOutput(plate, props, model.stepIdx))
  if (props.crossSectionPoint1 && props.crossSectionPoint2 && props.showCrossSectionView &&
     (!props.playing || shouldUpdate('crossSection', model.stepIdx))) {
    result.crossSection = getCrossSection(model.plates, props.crossSectionPoint1, props.crossSectionPoint2)
  }
  return result
}
