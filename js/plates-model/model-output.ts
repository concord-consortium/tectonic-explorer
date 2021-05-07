import getCrossSection, { IChunkArray } from "./get-cross-section";
import debugMarker from "./debug-marker";
import config from "../config";
import { IWorkerProps } from "./model-worker";
import Model from "./model";
import Plate from "./plate";
import * as THREE from "three";
import Field from "./field";

export interface IFieldsOutput {
  id: Uint32Array;
  elevation: Float32Array;
  normalizedAge: Float32Array;
  boundary?: Int8Array;
  earthquakeMagnitude?: Int8Array;
  earthquakeDepth?: Float32Array;
  volcanicEruption?: Int8Array;
  forceX?: Float32Array;
  forceY?: Float32Array;
  forceZ?: Float32Array;
  originalHue?: Int16Array;
  rockType?: Int16Array;
}

export interface IHotSpotOutput {
  position: THREE.Vector3;
  force: THREE.Vector3;
}

export interface IPlateOutput {
  id: number;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  hue?: number;
  density?: number;
  center: THREE.Vector3 | null;
  hotSpot?: IHotSpotOutput;
  fields?: IFieldsOutput;
}

export interface ICrossSectionOutput {
  dataFront: IChunkArray[];
  dataBack?: IChunkArray[];
  dataLeft?: IChunkArray[];
  dataRight?: IChunkArray[];
}

export interface IModelOutput {
  stepIdx: number;
  fieldMarkers: THREE.Vector3[];
  plates: IPlateOutput[];
  crossSection?: ICrossSectionOutput;
  debugMarker?: THREE.Vector3;
}

type UpdateCategory = "fields" | "crossSection"; 

// Sending data back to main thread is expensive. Don't send data too often and also try to distribute data
// among different messages, not to create one which would be very big (that's why offset is used).
const UPDATE_INTERVAL: Record<UpdateCategory, number> = {
  fields: 10,
  crossSection: 10
};

const UPDATE_OFFSET: Record<UpdateCategory, number> = {
  fields: 0,
  crossSection: 5
};

function shouldUpdate(name: UpdateCategory, stepIdx: number) {
  return (stepIdx + UPDATE_OFFSET[name]) % UPDATE_INTERVAL[name] === 0;
}

function markCrossSectionField(model: Model, crossSectionData: IChunkArray[]) {
  crossSectionData.forEach(segment => {
    if (!segment.isSubplate) {
      const plate = model.getPlate(segment.plate as number) as Plate;
      segment.chunks.forEach(data => {
        if (data.field) {
          const fieldId = data.field.id;
          if (fieldId != null && fieldId !== -1) {
            // Update the main plate field set used to render 3D globe view.
            (plate.fields.get(fieldId) as Field).marked = true;
            // Also, update cross-section data.
            data.field.marked = true;
          }
        }
      });
    }
  });
}

function plateOutput(plate: Plate, props: IWorkerProps | null, stepIdx: number, forcedUpdate: boolean): IPlateOutput {
  const result: IPlateOutput = {
    id: plate.id,
    quaternion: plate.quaternion,
    angularVelocity: plate.angularVelocity,
    hue: plate.hue,
    density: plate.density,
    center: plate.center
  };
  if (props?.renderHotSpots) {
    result.hotSpot = plate.hotSpot;
  }
  if (forcedUpdate || shouldUpdate("fields", stepIdx)) {
    // What is visibleAdjacentFields and why? Simple trick to make gaps between plates smaller.
    // visibleAdjacentFields contains fields that are adjacent to the plate and will be added to it soon.
    const visibleAdjacentFields = plate.getVisibleAdjacentFields();
    const size = plate.size + visibleAdjacentFields.length;
    result.fields = {
      id: new Uint32Array(size),
      elevation: new Float32Array(size),
      normalizedAge: new Float32Array(size)
    };
    const fields = result.fields;
    if (props?.renderBoundaries) {
      fields.boundary = new Int8Array(size);
    }
    if (props?.earthquakes) {
      fields.earthquakeMagnitude = new Int8Array(size);
      fields.earthquakeDepth = new Float32Array(size);
    }
    if (props?.volcanicEruptions) {
      fields.volcanicEruption = new Int8Array(size);
    }
    if (props?.renderForces) {
      fields.forceX = new Float32Array(size);
      fields.forceY = new Float32Array(size);
      fields.forceZ = new Float32Array(size);
    }
    if (props?.colormap === "plate") {
      fields.originalHue = new Int16Array(size);
    }
    if (props?.colormap === "rock") {
      fields.rockType = new Int16Array(size);
    }
    let idx = 0;
    plate.fields.forEach((field: Field) => {
      fields.id[idx] = field.id;
      fields.elevation[idx] = field.elevation;
      fields.normalizedAge[idx] = field.normalizedAge;
      if (fields.boundary) {
        fields.boundary[idx] = field.boundary ? 1 : 0;
      }
      if (fields.earthquakeMagnitude && fields.earthquakeDepth && field.earthquake) {
        fields.earthquakeMagnitude[idx] = field.earthquake.magnitude;
        fields.earthquakeDepth[idx] = field.earthquake.depth;
      }
      if (fields.volcanicEruption) {
        fields.volcanicEruption[idx] = field.volcanicEruption ? 1 : 0;
      }
      if (fields.forceX && fields.forceY && fields.forceZ) {
        const force = field.force;
        fields.forceX[idx] = force.x;
        fields.forceY[idx] = force.y;
        fields.forceZ[idx] = force.z;
      }
      if (fields.originalHue && field.originalHue !== null) {
        // We can't pass null in Int16 array so use -1.
        fields.originalHue[idx] = field.originalHue != null ? field.originalHue : -1;
      }
      if (fields.rockType) {
        fields.rockType[idx] = field.rockType;
      }
      idx += 1;
    });
    // Rendering code won't know difference between normal and adjacent fields anyway.
    visibleAdjacentFields.forEach((field: Field) => {
      fields.id[idx] = field.id;
      fields.elevation[idx] = field.avgNeighbor("elevation");
      fields.normalizedAge[idx] = field.avgNeighbor("normalizedAge");
      if (fields.rockType) {
        fields.rockType[idx] = field.rockType;
      }
      if (fields.boundary) {
        fields.boundary[idx] = field.boundary ? 1 : 0;
      }
      idx += 1;
    });
  }
  return result;
}

let prevPlatesIds = "";

export default function modelOutput(model: Model | null, props: IWorkerProps | null = null, forcedUpdate = false): IModelOutput {
  if (!model) {
    return { stepIdx: 0, plates: [], fieldMarkers: [] };
  }
  
  // When some plates are added or removed, it's very likely all the fields should be updated.
  // Without that there's a short flash when two plates are merged together.
  const currentPlateIds = JSON.stringify(model.plates.map(p => p.id));
  if (currentPlateIds !== prevPlatesIds) {
    forcedUpdate = true;
  }
  prevPlatesIds = currentPlateIds;

  const result: IModelOutput = {
    stepIdx: model.stepIdx,
    debugMarker,
    fieldMarkers: [],
    plates: model.plates.map((plate: Plate) => plateOutput(plate, props, model.stepIdx, forcedUpdate))
  };
  if (props?.crossSectionPoint1 && props.crossSectionPoint2 && props.showCrossSectionView &&
    (forcedUpdate || shouldUpdate("crossSection", model.stepIdx))) {
    const swap = props.crossSectionSwapped;
    const p1 = props.crossSectionPoint1;
    const p2 = props.crossSectionPoint2;
    const p3 = props.crossSectionPoint3;
    const p4 = props.crossSectionPoint4;
    result.crossSection = {
      dataFront: getCrossSection(model.plates, swap ? p2 : p1, swap ? p1 : p2, props)
    };
    if (config.crossSection3d && p3 && p4) {
      result.crossSection.dataRight = getCrossSection(model.plates, swap ? p1 : p2, swap ? p4 : p3, props);
      result.crossSection.dataBack = getCrossSection(model.plates, swap ? p4 : p3, swap ? p3 : p4, props);
      result.crossSection.dataLeft = getCrossSection(model.plates, swap ? p3 : p4, swap ? p2 : p1, props);
    }
    if (config.markCrossSectionFields) {
      // Marks all the field useful. 
      model.forEachField((field: Field) => {
        field.marked = false;
      });
      markCrossSectionField(model, result.crossSection.dataFront);
      if (result.crossSection.dataRight) {
        markCrossSectionField(model, result.crossSection.dataRight);
      }
      if (result.crossSection.dataBack) {
        markCrossSectionField(model, result.crossSection.dataBack);
      }
      if (result.crossSection.dataLeft) {
        markCrossSectionField(model, result.crossSection.dataLeft);
      }
    }
  }
  // There's significantly less number of marked fields than fields in general. That's why it's better to keep
  // them separately rather than transfer `marked` property for every single field.
  model.forEachField((field: Field) => {
    if (field.marked && field.plate.visible) {
      result.fieldMarkers.push(field.absolutePos);
    }
  });
  return result;
}
