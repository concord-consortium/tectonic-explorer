import * as THREE from "three";
import * as ta from "timeseries-analysis";
import c from "../constants";
import config from "../config";
import { MIN_DEPTH as EARTHQUAKE_MIN_DEPTH } from "./earthquake";

const TimeseriesAnalysis = ta.main;

const SAMPLING_DIST = 5; // km

// Affects smoothing strength.
const SMOOTHING_PERIOD = 6;

// Smooth field data only if it's ocean. Keep continents and islands rough / sharp.
// Smoothing mainly helps with subduction.
function shouldSmoothFieldData(field: any) {
  return field.oceanicCrust;
}

// Look at 3 nearest fields. If the nearest one is an ocean, look at it's neighbours and smooth out data a bit.
function getFieldAvgData(plate: any, pos: any, props: any) {
  const data = plate.nearestFields(pos, 3);
  if (data.length === 0) {
    return null;
  }
  const nearestField = data[0].field;
  const result = getFieldRawData(nearestField, props);
  if (!shouldSmoothFieldData(nearestField)) {
    return result; // just raw data
  }
  // Calculate weighted average (weight: 1 / distance).
  result.elevation = 0;
  result.crustThickness = 0;
  result.lithosphereThickness = 0;
  let wSum = 0;
  data.forEach((entry: any) => {
    const field = entry.field;
    if (!shouldSmoothFieldData(field)) {
      return;
    }
    const w = 1 / entry.dist;
    result.elevation += w * field.elevation;
    result.crustThickness += w * field.crustThickness;
    result.lithosphereThickness += w * field.lithosphereThickness;
    wSum += w;
  });
  result.elevation /= wSum;
  result.crustThickness /= wSum;
  result.lithosphereThickness /= wSum;
  if ((result as any).earthquake) {
    // Ensure that earthquake doesn't end up being above plate surface due to elevation smoothing.
    // Subducting field is taken into account to handle cases around trenches, where subducting field is actually
    // higher than the base field. The problem still might happen, as subduction field will be smoothed out later,
    // so we're not using a final value here. But in most cases, this approach is good enough.
    const maxDepth = Math.max(result.elevation, nearestField.subductingFieldUnderneath?.elevation) - EARTHQUAKE_MIN_DEPTH;
    (result as any).earthquake.depth = Math.min((result as any).earthquake.depth, maxDepth);
  }
  return result;
}

// Returns copy of field data necessary to draw a cross-section.
function getFieldRawData(field: any, props: any) {
  const result = {
    id: field.id,
    elevation: field.elevation,
    crustThickness: field.crustThickness,
    lithosphereThickness: field.lithosphereThickness
  };
  // Use conditionals so we transfer minimal amount of data from worker to the main thread.
  // This data is not processed later, it's directly passed to the main thread.
  if (field.oceanicCrust) {
    (result as any).oceanicCrust = true;
  }
  if (field.subduction) {
    (result as any).subduction = true;
  }
  if (field.risingMagma) {
    (result as any).risingMagma = true;
  }
  if (field.marked) {
    (result as any).marked = true;
  }
  if (props.earthquakes && field.earthquake) {
    (result as any).earthquake = {
      magnitude: field.earthquake.magnitude,
      depth: field.earthquake.depth
    };
  }
  if (props.volcanicEruptions && field.volcanicEruption) {
    (result as any).volcanicEruption = true;
  }
  return result;
}

// Accepts an array of cross-section points and smooths out provided property.
function smoothProperty(chunkData: any, prop: any) {
  // Generate input in a format accepted by TimeseriesAnalysis.
  const values = chunkData.map((point: any) => [point.dist, point.field?.[prop]]);
  // See: https://github.com/26medias/timeseries-analysis
  const smoothed = (new TimeseriesAnalysis(values)).smoother({ period: SMOOTHING_PERIOD }).output().map((arr: any) => arr[1]);
  // Copy back smoothed values.
  chunkData.forEach((point: any, idx: any) => {
    if (!point.field) {
      return;
    }
    point.field[prop] = smoothed[idx];
  });
}

// Looks for continuous subduction areas and applies numerical smoothing to each of them.
function smoothSubductionAreas(chunkData: any) {
  const subductionLine: any[] = [];
  chunkData.forEach((point: any, idx: any) => {
    const firstOrLast = idx === 0 || idx === chunkData.length - 1;
    if (!firstOrLast && point.field && (point.field.subduction || (point.field.oceanicCrust && subductionLine.length > 0))) {
      // `subductionLine` is a continuous line of points that are subducting (or oceanic crust to ignore small artifacts).
      // Don't smooth out first and last point to make sure that it matches neighbouring cross-section in the 3D mode.
      subductionLine.push(point);
    } else if (subductionLine.length > 0) {
      // Other point (e.g. continent or break in data) has been found, so it's time to smooth out last line data.
      smoothProperty(subductionLine, "elevation");
      // Reset and start building new one.
      subductionLine.length = 0;
    }
  });
  if (subductionLine.length > 0) {
    smoothProperty(subductionLine, "elevation");
  }
}

function sortByStartDist(a: any, b: any) {
  return a[0].distStart - b[0].distStart;
}

function fillGaps(result: any, length: any) {
  if (result.length === 0) {
    return;
  }
  // Skip subplates. They should be rendered underneath normal plate and they are never part of a divergent boundary.
  const sortedChunks = result.slice().sort(sortByStartDist).filter((chunk: any) => !chunk.isSubplate);
  let chunk1 = sortedChunks.shift();
  if (chunk1[0].dist > 0) {
    // Handle edge case when the cross-section line starts in a blank area.
    addDivergentBoundaryCenter(null, chunk1, 0);
  }
  while (sortedChunks.length > 0) {
    const chunk2 = sortedChunks.shift();
    const ch1LastPoint = chunk1[chunk1.length - 1];
    const ch2FirstPoint = chunk2[0];
    const ch2LastPoint = chunk2[chunk2.length - 1];
    if (ch1LastPoint.distEnd < ch2FirstPoint.distStart) {
      const diff = Math.round(ch2FirstPoint.distStart - ch1LastPoint.distEnd);
      if (diff <= SAMPLING_DIST || chunk1.plate === chunk2.plate) {
        // Merge two chunks.
        // diff <= SAMPLING_DIST handles a case when two plates are touching each other. It ensures that there's no
        // gap between them (even though there's some distance between hexagon centers).
        chunk1.push(...chunk2);
        chunk2.length = 0;
      } else {
        const newDist = (ch1LastPoint.distEnd + ch2FirstPoint.distStart) * 0.5;
        addDivergentBoundaryCenter(chunk1, chunk2, newDist);
        chunk1 = chunk2;
      }
    } else if (ch1LastPoint.distEnd <= ch2LastPoint.distEnd) {
      chunk1 = chunk2;
    }
  }
  if (chunk1[chunk1.length - 1].dist < length) {
    // Handle edge case when the cross-section line ends in a blank area.
    addDivergentBoundaryCenter(chunk1, null, length);
  }
}

function setupDivergentBoundaryField(divBoundaryPoint: any, prevPoint: any, nextPoint: any) {
  // This simplifies calculations when one point is undefined.
  if (!prevPoint) {
    prevPoint = nextPoint;
  }
  if (!nextPoint) {
    nextPoint = prevPoint;
  }
  const prevField = prevPoint.field;
  const nextField = nextPoint.field;
  if (!prevField.oceanicCrust && !nextField.oceanicCrust) {
    const width = Math.abs(nextPoint.dist - divBoundaryPoint.dist) + Math.abs(prevPoint.dist - divBoundaryPoint.dist);
    // Why divide by earth radius? `continentalStretchingRatio` is used in together with model units (radius = 1),
    // while the cross-section data is using kilometers.
    const stretchAmount = config.continentalStretchingRatio * width / c.earthRadius;
    divBoundaryPoint.field = {
      oceanicCrust: false,
      risingMagma: false,
      elevation: (prevField.elevation + nextField.elevation) * 0.5 - stretchAmount,
      crustThickness: (prevField.crustThickness + nextField.crustThickness) * 0.5 - stretchAmount,
      lithosphereThickness: (prevField.lithosphereThickness + nextField.lithosphereThickness) * 0.5,
      subduction: false,
      id: -1
    };
  } else {
    divBoundaryPoint.field = {
      oceanicCrust: true,
      risingMagma: true,
      elevation: config.oceanicRidgeElevation,
      crustThickness: 0,
      lithosphereThickness: 0,
      subduction: false,
      id: -1
    };
  }
}

function addDivergentBoundaryCenter(prevChunkData: any, nextChunkData: any, dist: any) {
  const divBoundaryPoint = {
    field: null,
    distStart: dist,
    dist,
    distEnd: dist
  };
  let prevPoint = null;
  let nextPoint = null;
  if (prevChunkData) {
    prevPoint = prevChunkData[prevChunkData.length - 1];
    prevChunkData.push(divBoundaryPoint);
  }
  if (nextChunkData) {
    nextPoint = nextChunkData[0];
    nextChunkData.unshift(divBoundaryPoint);
  }
  if (prevPoint || nextPoint) {
    setupDivergentBoundaryField(divBoundaryPoint, prevPoint, nextPoint);
  }
}

function getStepRotation(p1: any, p2: any, steps: any) {
  const finalRotation = new THREE.Quaternion();
  finalRotation.setFromUnitVectors(p1, p2);
  const stepRotation = new THREE.Quaternion();
  stepRotation.slerp(finalRotation, 1 / steps);
  return stepRotation;
}

function equalFields(f1: any, f2: any) {
  return f1.id === f2.id;
}

function calculatePointCenters(result: any) {
  result.forEach((chunkData: any) => {
    chunkData.forEach((point: any, idx: any) => {
      if (idx === 0) {
        point.dist = point.distStart;
      } else if (idx === chunkData.length - 1) {
        point.dist = point.distEnd;
      } else {
        point.dist = (point.distStart + point.distEnd) * 0.5;
      }
    });
  });
}

// Returns cross-section data for given plates, between point1 and point2.
// Result is an array of arrays. Each array corresponds to one plate.
export default function getCrossSection(plates: any, point1: any, point2: any, props: any) {
  const result: any = [];
  const p1 = (new THREE.Vector3(point1.x, point1.y, point1.z)).normalize();
  const p2 = (new THREE.Vector3(point2.x, point2.y, point2.z)).normalize();
  const arcLength = p1.angleTo(p2) * c.earthRadius;
  const steps = Math.round(arcLength / SAMPLING_DIST);
  const stepLength = arcLength / steps;
  const stepRotation = getStepRotation(p1, p2, steps);
  const platesAndSubplates: any[] = [];
  plates.forEach((plate: any) => {
    platesAndSubplates.push(plate);
    if (plate.subplate.size > 0) {
      platesAndSubplates.push(plate.subplate);
    }
  });
  platesAndSubplates.forEach(plate => {
    let dist = 0;
    const pos = p1.clone();
    let currentData: any = null;
    for (let i = 0; i <= steps; i += 1) {
      const field = plate.fieldAtAbsolutePos(pos) || null;
      if (!field) {
        if (currentData) {
          result.push(currentData);
          currentData = null;
        }
      } else {
        if (!currentData) {
          currentData = [];
          currentData.plate = plate.id;
          currentData.isSubplate = plate.isSubplate;
        }
        let fieldData = null;
        if (config.smoothCrossSection) {
          fieldData = getFieldAvgData(plate, pos, props);
        } else {
          fieldData = getFieldRawData(field, props);
        }
        const prevData = currentData[currentData.length - 1];
        if (!prevData || !equalFields(prevData.field, fieldData) || i === steps) {
          // Keep one data point per one field. Otherwise, rough steps between fields would be visible.
          // Always add the last point in the cross-section (i === step) to make sure that it matches
          // the first point of the neighbouring cross-section wall (in 3D mode). It's important only when
          // `getFieldAvgData` is being used. It might return different results for the same field, depending on exact
          // sampling position (it might take into account different neighbours).
          currentData.push({ field: fieldData, distStart: dist, distEnd: dist });
        } else if (prevData) {
          prevData.distEnd = dist;
        }
      }
      dist += stepLength;
      pos.applyQuaternion(stepRotation);
    }
    if (currentData) {
      result.push(currentData);
    }
  });
  calculatePointCenters(result);
  fillGaps(result, arcLength);
  if (config.smoothCrossSection) {
    // Smooth subduction areas.
    result.forEach((chunkData: any) => {
      smoothSubductionAreas(chunkData);
    });
  }
  return result;
}
