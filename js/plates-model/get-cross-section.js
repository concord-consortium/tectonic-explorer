import * as THREE from 'three'
import c from '../constants'

const SAMPLING_DIST = 20 // km

function getStepRotation (p1, p2, steps) {
  const finalRotation = new THREE.Quaternion()
  finalRotation.setFromUnitVectors(p1, p2)
  const stepRotation = new THREE.Quaternion()
  stepRotation.slerp(finalRotation, 1 / steps)
  return stepRotation
}

export default function getCrossSection (plates, point1, point2) {
  const p1 = point1.clone().normalize()
  const p2 = point2.clone().normalize()
  const arcLength = p1.angleTo(p2) * c.earthRadius
  const steps = Math.round(arcLength / SAMPLING_DIST)
  const stepLength = arcLength / steps
  const stepRotation = getStepRotation(p1, p2, steps)

  const result = []
  plates.forEach(plate => {
    const data = []
    const pos = p1.clone()
    let dist = 0
    for (let i = 0; i < steps; i += 1) {
      const field = plate.fieldAtAbsolutePos(pos) || null
      const prevData = data[data.length - 1]
      if (!prevData || prevData.field !== field) {
        data.push({ field, dist })
      }
      dist += stepLength
      pos.applyQuaternion(stepRotation)
    }
    // Make sure that cross section data goes exactly from p1 to p2 and has constant width, always insert the last point.
    data.push({ field: plate.fieldAtAbsolutePos(pos) || null, dist })
    result.push(data)
  })
  return result
}
