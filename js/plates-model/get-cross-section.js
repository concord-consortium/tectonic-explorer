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
    subduction: !!nearestField.subduction,
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
    subduction: !!field.subduction,
    elevation: field.elevation,
    crustThickness: field.crustThickness,
    lithosphereThickness: field.lithosphereThickness
  }
}

// Accepts an array of cross section points and smooths out provided property.
function smoothProperty (chunkData, prop) {
  // Generate input in a format accepted by TimeseriesAnalysis.
  const values = chunkData.map(point => [point.dist, point.field && point.field[prop]])
  // See: https://github.com/26medias/timeseries-analysis
  const smoothed = (new TimeseriesAnalysis(values)).smoother({ period: SMOOTHING_PERIOD }).output().map(arr => arr[1])
  // Copy back smoothed values.
  chunkData.forEach((point, idx) => {
    if (!point.field) return
    point.field[prop] = smoothed[idx]
  })
}

// Looks for continuous subduction areas and applies numerical smoothing to each of them.
function smoothSubductionAreas (chunkData) {
  const subductionLine = []
  chunkData.forEach(point => {
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

function sortByStartDist (a, b) {
  return a[0].distStart - b[0].distStart
}

function fillGaps (result, length) {
  if (result.length === 0) {
    return
  }
  const sortedChunks = result.slice().sort(sortByStartDist)
  let chunk1 = sortedChunks.shift()
  if (chunk1[0].dist > 0) {
    // Handle edge case when the cross section line starts in a blank area.
    addDivergentBoundaryCenter(null, chunk1, 0)
  }
  while (sortedChunks.length > 0) {
    const chunk2 = sortedChunks.shift()
    const ch1LastPoint = chunk1[chunk1.length - 1]
    const ch2FirstPoint = chunk2[0]
    const ch2LastPoint = chunk2[chunk2.length - 1]
    if (ch1LastPoint.distEnd < ch2FirstPoint.distStart) {
      const diff = Math.round(ch2FirstPoint.distStart - ch1LastPoint.distEnd)
      if (diff <= SAMPLING_DIST || chunk1.plate === chunk2.plate) {
        // Merge two chunks.
        // diff <= SAMPLING_DIST handles a case when two plates are touching each other. It ensures that there's no
        // gap between them (even though there's some distance between hexagon centers).
        chunk1.push.apply(chunk1, chunk2)
        chunk2.length = 0
      } else {
        const newDist = (ch1LastPoint.distEnd + ch2FirstPoint.distStart) * 0.5
        addDivergentBoundaryCenter(chunk1, chunk2, newDist)
        chunk1 = chunk2
      }
    } else if (ch1LastPoint.distEnd <= ch2LastPoint.distEnd) {
      chunk1 = chunk2
    }
  }
  if (chunk1[chunk1.length - 1].dist < length) {
    // Handle edge case when the cross section line ends in a blank area.
    addDivergentBoundaryCenter(chunk1, null, length)
  }
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
      subduction: false,
      id: -1
    }
  } else {
    divBoundaryPoint.field = {
      isOcean: true,
      elevation: config.oceanicRidgeElevation,
      crustThickness: 0,
      lithosphereThickness: 0,
      subduction: false,
      id: -1
    }
  }
}

function addDivergentBoundaryCenter (prevChunkData, nextChunkData, dist) {
  const divBoundaryPoint = {
    field: null, // will be setup by setupDivergentBoundaryField
    distStart: dist,
    dist,
    distEnd: dist
  }
  let prevPoint = null
  let nextPoint = null
  if (prevChunkData) {
    prevPoint = prevChunkData[prevChunkData.length - 1]
    prevChunkData.push(divBoundaryPoint)
  }
  if (nextChunkData) {
    nextPoint = nextChunkData[0]
    nextChunkData.unshift(divBoundaryPoint)
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
  return f1.id === f2.id
}

function calculatePointCenters (result) {
  result.forEach(chunkData => {
    chunkData.forEach((point, idx) => {
      if (idx === 0) {
        point.dist = point.distStart
      } else if (idx === chunkData.length - 1) {
        point.dist = point.distEnd
      } else {
        point.dist = (point.distStart + point.distEnd) * 0.5
      }
    })
  })
}

// Returns cross section data for given plates, between point1 and point2.
// Result is an array of arrays. Each array corresponds to one plate.
export default function getCrossSection (plates, point1, point2) {
  const p1 = (new THREE.Vector3(point1.x, point1.y, point1.z)).normalize()
  const p2 = (new THREE.Vector3(point2.x, point2.y, point2.z)).normalize()
  const arcLength = p1.angleTo(p2) * c.earthRadius
  const steps = Math.round(arcLength / SAMPLING_DIST)
  const stepLength = arcLength / steps
  const stepRotation = getStepRotation(p1, p2, steps)

  const result = []

  plates.forEach(plate => {
    let dist = 0
    const pos = p1.clone()
    let currentData = null
    for (let i = 0; i <= steps; i += 1) {
      const field = plate.fieldAtAbsolutePos(pos) || null
      if (!field) {
        if (currentData) {
          result.push(currentData)
          currentData = null
        }
      } else {
        if (!currentData) {
          currentData = []
          currentData.plate = plate.id
        }
        let fieldData = null
        if (config.smoothCrossSection) {
          fieldData = getFieldAvgData(plate, pos)
        } else {
          fieldData = getFieldRawData(field)
        }
        const prevData = currentData[currentData.length - 1]
        if (!prevData || !equalFields(prevData.field, fieldData)) {
          // Keep one data point per one field. Otherwise, rough steps between fields would be visible.
          currentData.push({ field: fieldData, distStart: dist, distEnd: dist })
        } else if (prevData) {
          prevData.distEnd = dist
        }
      }
      dist += stepLength
      pos.applyQuaternion(stepRotation)
    }
    if (currentData) {
      result.push(currentData)
    }
  })
  calculatePointCenters(result)
  fillGaps(result, arcLength)
  if (config.smoothCrossSection) {
    // Smooth subduction areas.
    result.forEach(chunkData => {
      smoothSubductionAreas(chunkData)
    })
  }
  return result
}
