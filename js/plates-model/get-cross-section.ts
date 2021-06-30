import * as THREE from "three";
import * as ta from "timeseries-analysis";
import c from "../constants";
import config from "../config";
import { MIN_DEPTH as EARTHQUAKE_MIN_DEPTH } from "./earthquake";
import Field from "./field";
import Plate from "./plate";
import { IWorkerProps } from "./model-worker";
import Subplate from "./subplate";
// PJ 6/29/2021: If Rock is imported directly from ./rock-properties, the app isn't rendered correctly. 
// The same thing happens if Rock is declared in this file or in ./ types.ts. At the same time, importing Crust 
// doesn't change anything. I absolutely cannot explain that at this moment. Maybe it's related to some really awkward 
// TS transpilation issue? Or there's something wrong in this file? 
import { Rock  } from "./crust";
const TimeseriesAnalysis = ta.main;

export interface IEarthquake {
  depth: number;
  magnitude: number;
}

export interface IRockLayerData {
  rock: Rock;
  // Layer use only relative thickness, so it's possible to smooth out the total crust thickness,
  // and don't worry about rock layers.
  relativeThickness: number;
}

export interface IMagmaBlobData {
  dist: number;
  xOffset: number;
  finalRockType: Rock | undefined;
  active: boolean;
}

export interface IFieldData {
  id: number;
  elevation: number;
  crustThickness: number;
  rockLayers: IRockLayerData[],
  lithosphereThickness: number;
  canSubduct?: boolean;
  divergentBoundaryMagma?: boolean;
  volcanicEruption?: boolean;
  marked?: boolean;
  subduction?: number;
  earthquake?: IEarthquake;
  normalizedAge?: number;
  magma?: IMagmaBlobData[];
  metamorphic?: number;
}

export interface IChunk {
  field: IFieldData | null;
  distStart: number;
  distEnd: number;
  dist: number;
}

export interface IChunkArray {
  plate: number | string; // subplates use string
  isSubplate: boolean;
  chunks: IChunk[];
}

const SAMPLING_DIST = 5; // km
// Affects smoothing strength.
const SMOOTHING_PERIOD = 6;

const DIV_BOUNDARY_WIDTH = 200; // km

// Smooth field data only if it's ocean. Keep continents and islands rough / sharp.
// Smoothing mainly helps with subduction.
function shouldSmoothFieldData(field: Field) {
  return field.subduction;
}

// Look at 3 nearest fields. If the nearest one is an ocean, look at it's neighbors and smooth out data a bit.
function getFieldAvgData(plate: Plate | Subplate, pos: THREE.Vector3, props: IWorkerProps): IFieldData | null {
  const data = plate.nearestFields(pos, 3);
  if (data.length === 0) {
    return null;
  }
  const nearestField = data[0].field;
  const result: IFieldData = getFieldRawData(nearestField, props);
  if (!shouldSmoothFieldData(nearestField)) {
    return result; // just raw data
  }
  // Calculate weighted average (weight: 1 / distance).
  result.elevation = 0;
  result.crustThickness = 0;
  result.lithosphereThickness = 0;
  let wSum = 0;
  data.forEach((entry: { field: Field, dist: number }) => {
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
  if (result.earthquake) {
    // Ensure that earthquake doesn't end up being above plate surface due to elevation smoothing.
    // Subducting field is taken into account to handle cases around trenches, where subducting field is actually
    // higher than the base field. The problem still might happen, as subduction field will be smoothed out later,
    // so we're not using a final value here. But in most cases, this approach is good enough.
    const maxDepth = Math.max(result.elevation, nearestField.subductingFieldUnderneath?.elevation || 0) - EARTHQUAKE_MIN_DEPTH;
    result.earthquake.depth = Math.min(result.earthquake.depth, maxDepth);
  }
  return result;
}

// Returns copy of field data necessary to draw a cross-section.
function getFieldRawData(field: Field, props?: IWorkerProps): IFieldData {
  const totalCrustThickness = field.crustThickness;
  const result: IFieldData = {
    id: field.id,
    elevation: field.elevation,
    crustThickness: totalCrustThickness,
    rockLayers: field.crust.rockLayers.map(rl => ({
      // Layer use only relative thickness, so it's possible to smooth out the total crust thickness,
      // and don't worry about rock layers.
      rock: rl.rock, relativeThickness: rl.thickness / totalCrustThickness
    })),
    lithosphereThickness: field.lithosphereThickness,
    normalizedAge: field.normalizedAge
  };
  if (field.crust.metamorphic > 0) {
    result.metamorphic = field.crust.metamorphic;
  }
  // Use conditionals so we transfer minimal amount of data from worker to the main thread.
  // This data is not processed later, it's directly passed to the main thread.
  if (field.crust.canSubduct()) {
    result.canSubduct = true;
  }
  if (field.subduction) {
    result.subduction = field.subduction.progress;
  }
  if (field.volcanicAct?.magma) {
    result.magma = field.volcanicAct.magma;
  }
  if (field.marked) {
    result.marked = true;
  }
  if (props?.earthquakes && field.earthquake) {
    result.earthquake = {
      magnitude: field.earthquake.magnitude,
      depth: field.earthquake.depth
    };
  }
  if (props?.volcanicEruptions && (field.volcanicEruption || field.volcanicAct?.erupting)) {
    result.volcanicEruption = true;
  }
  return result;
}

// Accepts an array of cross-section points and smooths out provided property.
function smoothProperty(chunkData: IChunk[], prop: keyof IFieldData) {
  // Generate input in a format accepted by TimeseriesAnalysis.
  const values = chunkData.map((point: IChunk) => [point.dist, point.field?.[prop]]);
  // See: https://github.com/26medias/timeseries-analysis
  const smoothed = (new TimeseriesAnalysis(values)).smoother({ period: SMOOTHING_PERIOD }).output().map((arr: any) => arr[1]);
  // Copy back smoothed values.
  chunkData.forEach((point: IChunk, idx: number) => {
    if (point.field) {
      (point.field as any)[prop] = smoothed[idx];
    }
  });
}

// Looks for continuous subduction areas and applies numerical smoothing to each of them.
function smoothSubductionAreas(chunkData: IChunkArray) {
  const subductionLine: IChunk[] = [];
  chunkData.chunks.forEach((point: IChunk, idx: number) => {
    const firstOrLast = idx === 0 || idx === chunkData.chunks.length - 1;
    if (!firstOrLast && point.field && (point.field.subduction || (point.field.canSubduct && subductionLine.length > 0))) {
      // `subductionLine` is a continuous line of points that are subducting (or oceanic crust to ignore small artifacts).
      // Don't smooth out first and last point to make sure that it matches neighboring cross-section in the 3D mode.
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

function sortByStartDist(a: IChunkArray, b: IChunkArray) {
  return a.chunks[0]?.distStart - b.chunks[0]?.distStart;
}

function fillGaps(result: IChunkArray[], length: number) {
  if (result.length === 0) {
    return;
  }
  // Skip subplates. They should be rendered underneath normal plate and they are never part of a divergent boundary.
  const sortedChunks = result.slice().sort(sortByStartDist).filter((chunk: IChunkArray) => !chunk.isSubplate);
  let chunk1 = sortedChunks.shift();
  if (chunk1 && chunk1.chunks[0]?.dist > SAMPLING_DIST) {
    // Handle edge case when the cross-section line starts in a blank area.
    addDivergentBoundaryCenter(null, chunk1, 0);
  }
  while (sortedChunks.length > 0) {
    const chunk2 = sortedChunks.shift();
    const ch1LastPoint = chunk1?.chunks[chunk1.chunks.length - 1];
    const ch2FirstPoint = chunk2?.chunks[0];
    const ch2LastPoint = chunk2?.chunks[chunk2.chunks.length - 1];
    if (ch1LastPoint && ch2FirstPoint && ch1LastPoint.distEnd < ch2FirstPoint.distStart) {
      const diff = Math.round(ch2FirstPoint.distStart - ch1LastPoint.distEnd);
      if (diff <= SAMPLING_DIST || chunk1?.plate === chunk2?.plate) {
        // Merge two chunks.
        // diff <= SAMPLING_DIST handles a case when two plates are touching each other. It ensures that there's no
        // gap between them (even though there's some distance between hexagon centers).
        chunk1?.chunks.push(...(chunk2?.chunks || []));
        if (chunk2) {
          chunk2.chunks.length = 0;
        }
      } else {
        const newDist = (ch1LastPoint.distEnd + ch2FirstPoint.distStart) * 0.5;
        addDivergentBoundaryCenter(chunk1 || null, chunk2 || null, newDist);
        chunk1 = chunk2;
      }
    } else if (ch1LastPoint && ch2LastPoint && ch1LastPoint.distEnd <= ch2LastPoint.distEnd) {
      chunk1 = chunk2;
    }
  }
  if (chunk1 && chunk1.chunks[chunk1.chunks.length - 1]?.dist < length - SAMPLING_DIST) {
    // Handle edge case when the cross-section line ends in a blank area.
    addDivergentBoundaryCenter(chunk1, null, length);
  }
}

function setupDivergentBoundaryField(divBoundaryPoint: IChunk, prevPoint: IChunk | null, nextPoint: IChunk | null) {
  // This simplifies calculations when one point is undefined.
  if (!prevPoint) {
    prevPoint = nextPoint;
  }
  if (!nextPoint) {
    nextPoint = prevPoint;
  }
  const prevField = prevPoint?.field;
  const nextField = nextPoint?.field;
  const nextDist = nextPoint?.dist || 0;
  const pervDist = prevPoint?.dist || 0;
  const prevElevation = prevField?.elevation || 0;
  const nextElevation = nextField?.elevation || 0;
  if (!prevField?.canSubduct && !nextField?.canSubduct) {
    const width = Math.abs(nextDist - divBoundaryPoint.dist) + Math.abs(pervDist - divBoundaryPoint.dist);
    // Why divide by earth radius? `continentalStretchingRatio` is used in together with model units (radius = 1),
    // while the cross-section data is using kilometers.
    const stretchAmount = config.continentalStretchingRatio * width / c.earthRadius;

    const prevCrustThickness = prevField?.crustThickness || 0;
    const nextCrustThickness = nextField?.crustThickness || 0;
    const prevLithosphereThickness = prevField?.lithosphereThickness || 0;
    const nextLithosphereThickness = nextField?.lithosphereThickness || 0;
    divBoundaryPoint.field = {
      canSubduct: false,
      elevation: (prevElevation + nextElevation) * 0.5 - stretchAmount,
      crustThickness: (prevCrustThickness + nextCrustThickness) * 0.5 - stretchAmount,
      rockLayers: nextField?.rockLayers || prevField?.rockLayers || [],
      lithosphereThickness: (prevLithosphereThickness + nextLithosphereThickness) * 0.5,
      subduction: 0,
      id: -1
    };
  } else {
    divBoundaryPoint.field = {
      canSubduct: true,
      divergentBoundaryMagma: true,
      elevation: 0.5 * (prevElevation + nextElevation) + config.oceanicRidgeElevation,
      crustThickness: 0.4,
      rockLayers: [
        { rock: Rock.Basalt, relativeThickness: 0.3 },
        { rock: Rock.Gabbro, relativeThickness: 0.7 }
      ],
      lithosphereThickness: 0.2,
      subduction: 0,
      normalizedAge: 0.2,
      id: -1
    };
  }
}

function addDivergentBoundaryCenter(prevChunkData: IChunkArray | null, nextChunkData: IChunkArray | null, dist: number) {
  const divBoundaryPoint = {
    field: null,
    distStart: dist,
    dist,
    distEnd: dist
  };
  let prevPoint = null;
  let nextPoint = null;
  if (prevChunkData) {
    prevPoint = prevChunkData.chunks[prevChunkData.chunks.length - 1];
    prevPoint.dist = dist - DIV_BOUNDARY_WIDTH * 0.5; // this ensures that divergent boundary has constant width
    prevChunkData.chunks.push(divBoundaryPoint);
  }
  if (nextChunkData) {
    nextPoint = nextChunkData.chunks[0];
    nextPoint.dist = dist + DIV_BOUNDARY_WIDTH * 0.5; // this ensures that divergent boundary has constant width
    nextChunkData.chunks.unshift(divBoundaryPoint);
  }
  if (prevPoint || nextPoint) {
    setupDivergentBoundaryField(divBoundaryPoint, prevPoint, nextPoint);
  }
}

function getStepRotation(p1: THREE.Vector3, p2: THREE.Vector3, steps: number) {
  const finalRotation = new THREE.Quaternion();
  finalRotation.setFromUnitVectors(p1, p2);
  const stepRotation = new THREE.Quaternion();
  stepRotation.slerp(finalRotation, 1 / steps);
  return stepRotation;
}

function equalFields(f1: IFieldData | null, f2?: IFieldData | null) {
  return f1?.id === f2?.id;
}

function calculatePointCenters(result: IChunkArray[]) {
  result.forEach((chunkData: IChunkArray) => {
    chunkData.chunks.forEach((point: IChunk, idx: number) => {
      if (idx === 0) {
        point.dist = point.distStart;
      } else if (idx === chunkData.chunks.length - 1) {
        point.dist = point.distEnd;
      } else {
        point.dist = (point.distStart + point.distEnd) * 0.5;
      }
    });
  });
}

// Returns cross-section data for given plates, between point1 and point2.
// Result is an array of arrays. Each array corresponds to one plate.
export default function getCrossSection(plates: Plate[], point1: THREE.Vector3, point2: THREE.Vector3, props: IWorkerProps) {
  const result: IChunkArray[] = [];
  const p1 = (new THREE.Vector3(point1.x, point1.y, point1.z)).normalize();
  const p2 = (new THREE.Vector3(point2.x, point2.y, point2.z)).normalize();
  const arcLength = p1.angleTo(p2) * c.earthRadius;
  const steps = Math.round(arcLength / SAMPLING_DIST);
  const stepLength = arcLength / steps;
  const stepRotation = getStepRotation(p1, p2, steps);
  const platesAndSubplates: (Plate | Subplate)[] = [];
  plates.forEach((plate: Plate) => {
    platesAndSubplates.push(plate);
    if (plate.subplate.size > 0) {
      platesAndSubplates.push(plate.subplate);
    }
  });
  platesAndSubplates.forEach(plate => {
    let dist = 0;
    const pos = p1.clone();
    let currentData: IChunkArray | null = null;
    for (let i = 0; i <= steps; i += 1) {
      const field = plate.fieldAtAbsolutePos(pos) || null;
      if (!field) {
        if (currentData) {
          result.push(currentData);
          currentData = null;
        }
      } else {
        if (!currentData) {
          currentData = {
            chunks: [],
            plate: plate.id,
            isSubplate: plate.isSubplate
          };
        }
        let fieldData: IFieldData | null = null;
        if (config.smoothCrossSection) {
          fieldData = getFieldAvgData(plate, pos, props);
        } else {
          fieldData = getFieldRawData(field, props);
        }
        const prevData = currentData.chunks[currentData.chunks.length - 1];
        if (!prevData || !equalFields(prevData.field, fieldData) || i === steps) {
          // Keep one data point per one field. Otherwise, rough steps between fields would be visible.
          // Always add the last point in the cross-section (i === step) to make sure that it matches
          // the first point of the neighboring cross-section wall (in 3D mode). It's important only when
          // `getFieldAvgData` is being used. It might return different results for the same field, depending on exact
          // sampling position (it might take into account different neighbors).
          currentData.chunks.push({ field: fieldData, distStart: dist, distEnd: dist, dist: -1 });
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
    result.forEach((chunkData: IChunkArray) => {
      smoothSubductionAreas(chunkData);
    });
  }
  return result;
}
