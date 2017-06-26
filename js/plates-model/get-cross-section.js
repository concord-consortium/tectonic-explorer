import * as THREE from 'three'
import * as ta from 'timeseries-analysis'
import c from '../constants'
import config from '../config'

const TimeseriesAnalysis = ta.main

const SAMPLING_DIST = 100 // km
// Affects smoothing strength.
const SMOOTHING_PERIOD = 6

// There's always an empty space between two plates that move in the opposite direction. In reality there should be
// an oceanic ridge. This kind of field is used by cross section algorithm to draw nicer output.
const RIDGE_FIELD = {
  id: -1,
  elevation: config.oceanicRidgeElevation,
  crustThickness: 0.01,
  lithosphereThickness: 0.01,
  isOcean: true,
  subduction: null
}

// Smooth field data only if it's ocean. Keep continents and islands rough / sharp.
// Smoothing mainly helps with subduction.
function shouldSmoothFieldData (field) {
  return field.isOcean && !field.island
}

// Look at 3 nearest fields. If the nearest one is an ocean, look at it's neighbours and smooth out data a bit.
function getFieldAvgData (plate, pos) {
  const data = plate.nearestFields(pos, 3)
  if (data.length === 0) return null
  const nearestField = data[0].field
  if (!shouldSmoothFieldData(nearestField)) {
    return getFieldRawData(nearestField)
  }
  // Calculate weighted average (weight: 1 / distance).
  const result = {
    id: nearestField.id,
    isOcean: nearestField.isOcean,
    subduction: nearestField.subduction,
    elevation: 0,
    crustThickness: 0,
    lithosphereThickness: 0
  }
  let wSum = 0
  data.forEach(entry => {
    const field = entry.field
    if (!shouldSmoothFieldData(field)) {
      return
    }
    const w = 1 / entry.dist
    result.elevation += w * field.elevation
    result.crustThickness += w * field.crustThickness
    result.lithosphereThickness += w * field.lithosphereThickness
    wSum += w
  })
  result.elevation /= wSum
  result.crustThickness /= wSum
  result.lithosphereThickness /= wSum
  return result
}

// Returns copy of field data necessary to draw a cross section.
function getFieldRawData (field) {
  return {
    id: field.id,
    isOcean: field.isOcean,
    subduction: field.subduction,
    elevation: field.elevation,
    crustThickness: field.crustThickness,
    lithosphereThickness: field.lithosphereThickness
  }
}

// Accepts an array of cross section points and smooths out provided property.
function smoothProperty (plateData, prop) {
  // Generate input in a format accepted by TimeseriesAnalysis.
  const values = plateData.map(point => [point.dist, point.field && point.field[prop]])
  // See: https://github.com/26medias/timeseries-analysis
  const smoothed = (new TimeseriesAnalysis(values)).smoother({ period: SMOOTHING_PERIOD }).output().map(arr => arr[1])
  // Copy back smoothed values.
  plateData.forEach((point, idx) => {
    if (!point.field) return
    point.field[prop] = smoothed[idx]
  })
}

// Looks for continuous subduction areas and applies numerical smoothing to each of them.
function smoothSubductionAreas (plateData) {
  const subductionLine = []
  plateData.forEach(point => {
    if (point.field && (point.field.subduction || (point.field.isOcean && subductionLine.length > 0))) {
      // `subductionLine` is a continuous line of points that are subducting (or oceanic crust to ignore small artifacts).
      subductionLine.push(point)
    } else if (subductionLine.length > 0) {
      // Other point (e.g. continent or break in data) has been found, so it's time to smooth out last line data.
      smoothProperty(subductionLine, 'elevation')
      // Reset and start building new one.
      subductionLine.length = 0
    }
  })
  if (subductionLine.length > 0) {
    smoothProperty(subductionLine, 'elevation')
  }
}

function getStepRotation (p1, p2, steps) {
  const finalRotation = new THREE.Quaternion()
  finalRotation.setFromUnitVectors(p1, p2)
  const stepRotation = new THREE.Quaternion()
  stepRotation.slerp(finalRotation, 1 / steps)
  return stepRotation
}

function equalFields (f1, f2) {
  if (f1 === null && f2 === null) return true
  if (f1 === null || f2 === null) return false
  return f1.id === f2.id
}

// Returns cross section data for given plates, between point1 and point2.
// Result is an array of arrays. Each array corresponds to one plate.
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
      const plateData = result[idx]
      const field = plate.fieldAtAbsolutePos(pos) || null
      let fieldData = null
      if (config.smoothCrossSection) {
        fieldData = field && getFieldAvgData(plate, pos)
      } else {
        fieldData = field && getFieldRawData(field)
      }
      const prevData = plateData[plateData.length - 1]
      if (i === steps || !prevData || !equalFields(prevData.field, field)) {
        // Keep one data point per one field. Otherwise, rough steps between fields would be visible.
        // i === steps => make sure that cross section plateData goes exactly from p1 to p2 and has constant width.
        plateData.push({ field: fieldData, dist })
      }
      if (field) {
        lastPlateData = plateData
        anyField = true
      }
    })
    // Handle oceanic ridges. There's an assumption that if there's no plate at given point, it's an oceanic ridge area.
    // Generate "fake" field and make sure its position (dist property) is in the middle of the empty area.
    // Also, add this field to plate on the left and right (using lastPlateData letiable).
    if (!anyField) {
      if (!ridgeData) {
        ridgeData = { field: Object.assign({}, RIDGE_FIELD), dist }
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

  if (config.smoothCrossSection) {
    result.forEach(plateData => {
      smoothSubductionAreas(plateData)
    })
  }

  return result
}
