import * as THREE from 'three'
import c from '../constants'
import config from '../config'

const SAMPLING_DIST = 10 // km

// There's always an empty space between two plates that move in the opposite direction. In reality there should be
// an oceanic ridge. This kind of field is used by cross section algorithm to draw nicer output.
const RIDGE_FIELD = {
  elevation: config.oceanicRidgeElevation,
  crustThickness: 0.01,
  lithosphereThickness: 0.01,
  isOcean: true
}

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

  const result = plates.map(plate => [])

  const pos = p1.clone()
  let dist = 0
  let ridgeData = null
  let lastPlateData = null
  for (let i = 0; i <= steps; i += 1) {
    let anyField = false
    plates.forEach((plate, idx) => {
      const data = result[idx]
      const field = plate.fieldAtAbsolutePos(pos) || null
      const prevData = data[data.length - 1]
      if (i === steps || !prevData || prevData.field !== field) {
        // i === steps => make sure that cross section data goes exactly from p1 to p2 and has constant width.
        data.push({ field, dist })
      }
      if (field) {
        lastPlateData = data
        anyField = true
      }
    })
    // Handle oceanic ridges. There's an assumption that if there's no plate at given point, it's an oceanic ridge area.
    // Generate "fake" field and make sure its position (dist property) is in the middle of the empty area.
    // Also, add this field to plate on the left and right (using lastPlateData variable).
    if (!anyField) {
      if (!ridgeData) {
        ridgeData = {field: RIDGE_FIELD, dist}
        if (lastPlateData) {
          // Replace the last point which would be null field (since anyField === false). This is handling left plate.
          lastPlateData[lastPlateData.length - 1] = ridgeData
        }
      } else {
        // Ensure that ridge field is in the middle of the blank space.
        ridgeData.dist += 0.5 * stepLength
      }
    } else if (anyField && ridgeData) {
      // Some field has been detected after empty space. Add ridge field to the plate on the right.
      lastPlateData.push(ridgeData)
      ridgeData = null
    }
    dist += stepLength
    pos.applyQuaternion(stepRotation)
  }
  return result
}
