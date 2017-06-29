import * as THREE from 'three'
import * as ta from 'timeseries-analysis'
import c from '../constants'
import config from '../config'

const TimeseriesAnalysis = ta.main

const SAMPLING_DIST = 5 // km
// Affects smoothing strength.
const SMOOTHING_PERIOD = 6

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

// Make sure that cross section data has width equal to the length of the cross section line.
// It prevents rendered image from getting narrower and wider all the time, depending on the location
// of underlying hexagons.
function stretchCrossSection (result, width) {
  result.forEach(plateData => {
    if (plateData.length === 0) {
      return
    }
    const left = plateData[0]
    const right = plateData[plateData.length - 1]
    if (left.field !== null) {
      left.dist = 0
    }
    if (right.field !== null) {
      right.dist = width
    }
  })
}

function setupDivergentBoundaryField (divBoundaryPoint, prevPoint, nextPoint) {
  // This simplifies calculations when one point is undefined.
  if (!prevPoint) prevPoint = nextPoint
  if (!nextPoint) nextPoint = prevPoint
  const prevField = prevPoint.field
  const nextField = nextPoint.field
  if (!prevField.isOcean && !nextField.isOcean) {
    const width = Math.abs(nextPoint.dist - divBoundaryPoint.dist) + Math.abs(prevPoint.dist - divBoundaryPoint.dist)
    // Why divide by earth radius? `continentalStretchingRatio` is used in together with model units (radius = 1),
    // while the cross section data is using kilometers.
    const stretchAmount = config.continentalStretchingRatio * width / c.earthRadius
    divBoundaryPoint.field = {
      isOcean: false,
      elevation: (prevField.elevation + nextField.elevation) * 0.5 - stretchAmount,
      crustThickness: (prevField.crustThickness + nextField.crustThickness) * 0.5 - stretchAmount,
      lithosphereThickness: (prevField.lithosphereThickness + nextField.lithosphereThickness) * 0.5,
      subduction: null,
      id: -1
    }
  } else {
    divBoundaryPoint.field = {
      isOcean: true,
      elevation: config.oceanicRidgeElevation,
      crustThickness: 0,
      lithosphereThickness: 0,
      subduction: null,
      id: -1
    }
  }
}

function addDivergentBoundaryCenter (prevPlateData, nextPlateData) {
  const divBoundaryPoint = {
    field: null, // will be setup by setupDivergentBoundaryField
    dist: 0
  }
  let prevPoint = null
  let nextPoint = null
  if (prevPlateData) {
    // Replace the last point which would be null field. Note that its distance is valuable,
    // it's in the middle of blank area where the ridge should be placed.
    divBoundaryPoint.dist = prevPlateData[prevPlateData.length - 1].dist
    prevPlateData[prevPlateData.length - 1] = divBoundaryPoint
    prevPoint = prevPlateData[prevPlateData.length - 2]
  }
  if (nextPlateData) {
    // Some field has been detected after empty space. Insert divergent boundary point just before the last field.
    nextPlateData.splice(nextPlateData.length - 1, 0, divBoundaryPoint)
    nextPoint = nextPlateData[nextPlateData.length - 1]
  }
  if (prevPoint || nextPoint) {
    setupDivergentBoundaryField(divBoundaryPoint, prevPoint, nextPoint)
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
  // Next three variables are used to handle divergent boundaries.
  let emptyAreaFound = false
  let lastFoundPlate = null
  let plateBeforeDivBoundary = null
  for (let i = 0; i <= steps; i += 1) {
    let anyFieldFound = false
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
      if (!prevData || !equalFields(prevData.field, fieldData)) {
        // Keep one data point per one field. Otherwise, rough steps between fields would be visible.
        plateData.push({ field: fieldData, dist })
      } else if (prevData) {
        // Make sure that cross section data points are in the middle of hexagons. This is a simple way to do it.
        prevData.dist += stepLength * 0.5
      }
      if (field) {
        lastFoundPlate = idx
        anyFieldFound = true
      }
    })
    // Detect empty areas and setup divergent boundaries.
    if (!anyFieldFound && !emptyAreaFound) {
      emptyAreaFound = true
      plateBeforeDivBoundary = lastFoundPlate
    } else if (anyFieldFound && emptyAreaFound) {
      if (lastFoundPlate !== plateBeforeDivBoundary) {
        // Plate found before blank space is different from plate found after blank space.
        // It means it's a divergent boundary.
        addDivergentBoundaryCenter(result[plateBeforeDivBoundary], result[lastFoundPlate])
      } else {
        // Plate found on both sides of the blank space is the same. It means that cross section line is probably
        // drawn at very small angle to the divergent boundary and shape of the fields (hexagons) is causing those blank
        // spots. Remove them to cleanup the result.
        const lastPlate = result[lastFoundPlate]
        // Remove the last null field. `lastPlate` data looks like this: [ ..., null field, last field ]
        // We can be sure that the last index is occupied by proper field as anyFieldFound is equal to true.
        lastPlate.splice(lastPlate.length - 2, 1)
      }
      emptyAreaFound = false
    }

    dist += stepLength
    pos.applyQuaternion(stepRotation)
  }

  // Handle case when cross section ends in divergent boundary area and no plate was found after.
  if (emptyAreaFound) {
    addDivergentBoundaryCenter(result[plateBeforeDivBoundary], null)
  }
  // Smooth subduction areas.
  if (config.smoothCrossSection) {
    result.forEach(plateData => {
      smoothSubductionAreas(plateData)
    })
  }
  // Make sure that cross section width is equal to arc length width.
  stretchCrossSection(result, arcLength)

  return result
}
