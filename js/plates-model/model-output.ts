import getCrossSection from "./get-cross-section";
import debugMarker from "./debug-marker";
import config from "../config";

// Sending data back to main thread is expensive. Don't send data too often and also try to distribute data
// among different messages, not to create one which would be very big (that's why offset is used).
const UPDATE_INTERVAL: Record<string, number> = {
  fields: 10,
  crossSection: 10
};

const UPDATE_OFFSET: Record<string, number> = {
  fields: 0,
  crossSection: 5
};

function shouldUpdate(name: any, stepIdx: any) {
  return (stepIdx + UPDATE_OFFSET[name]) % UPDATE_INTERVAL[name] === 0;
}

function plateOutput(plate: any, props: any, stepIdx: any, forcedUpdate: any) {
  const result: any = {};
  result.id = plate.id;
  result.quaternion = plate.quaternion;
  result.angularVelocity = plate.angularVelocity;
  result.hue = plate.hue;
  result.density = plate.density;
  result.center = plate.center;
  if (props.renderHotSpots) {
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
    if (props.renderBoundaries) {
      fields.boundary = new Int8Array(size);
    }
    if (props.earthquakes) {
      fields.earthquakeMagnitude = new Int8Array(size);
      fields.earthquakeDepth = new Float32Array(size);
    }
    if (props.volcanicEruptions) {
      fields.volcanicEruption = new Int8Array(size);
    }
    if (props.renderForces) {
      fields.forceX = new Float32Array(size);
      fields.forceY = new Float32Array(size);
      fields.forceZ = new Float32Array(size);
    }
    if (props.colormap === "plate") {
      fields.originalHue = new Int16Array(size);
    }
    let idx = 0;
    plate.fields.forEach((field: any) => {
      fields.id[idx] = field.id;
      fields.elevation[idx] = field.elevation;
      fields.normalizedAge[idx] = field.normalizedAge;
      if (props.renderBoundaries && field.boundary) {
        fields.boundary[idx] = field.boundary;
      }
      if (props.earthquakes && field.earthquake) {
        fields.earthquakeMagnitude[idx] = field.earthquake.magnitude;
        fields.earthquakeDepth[idx] = field.earthquake.depth;
      }
      if (props.volcanicEruptions) {
        fields.volcanicEruption[idx] = !!field.volcanicEruption;
      }
      if (props.renderForces) {
        const force = field.force;
        fields.forceX[idx] = force.x;
        fields.forceY[idx] = force.y;
        fields.forceZ[idx] = force.z;
      }
      if (props.colormap === "plate" && field.originalHue !== null) {
        // We can't pass null in Int16 array so use -1.
        fields.originalHue[idx] = field.originalHue !== null ? field.originalHue : -1;
      }
      idx += 1;
    });
    // Rendering code won't know difference between normal and adjacent fields anyway.
    visibleAdjacentFields.forEach((field: any) => {
      fields.id[idx] = field.id;
      fields.elevation[idx] = field.avgNeighbour("elevation");
      fields.normalizedAge[idx] = field.avgNeighbour("normalizedAge");
      idx += 1;
    });
  }
  return result;
}

export default function modelOutput(model: any, props: any = {}, forcedUpdate = false) {
  if (!model) {
    return { stepIdx: 0, plates: [], fieldMarkers: [] };
  }
  const result: any = {};
  result.stepIdx = model.stepIdx;
  result.debugMarker = debugMarker;
  // There's significantly less number of marked fields than fields in general. That's why it's better to keep
  // them separately rather than transfer `marked` property for every single field.
  result.fieldMarkers = [];
  model.forEachField((field: any) => {
    if (field.marked) {
      result.fieldMarkers.push(field.absolutePos);
    }
  });
  result.plates = model.plates.map((plate: any) => plateOutput(plate, props, model.stepIdx, forcedUpdate));
  if (props.crossSectionPoint1 && props.crossSectionPoint2 && props.showCrossSectionView &&
    (forcedUpdate || shouldUpdate("crossSection", model.stepIdx))) {
    result.crossSection = {};
    const swap = props.crossSectionSwapped;
    const p1 = props.crossSectionPoint1;
    const p2 = props.crossSectionPoint2;
    const p3 = props.crossSectionPoint3;
    const p4 = props.crossSectionPoint4;
    result.crossSection.dataFront = getCrossSection(model.plates, swap ? p2 : p1, swap ? p1 : p2, props);
    if (config.crossSection3d) {
      result.crossSection.dataRight = getCrossSection(model.plates, swap ? p1 : p2, swap ? p4 : p3, props);
      result.crossSection.dataBack = getCrossSection(model.plates, swap ? p4 : p3, swap ? p3 : p4, props);
      result.crossSection.dataLeft = getCrossSection(model.plates, swap ? p3 : p4, swap ? p2 : p1, props);
    }
  }
  return result;
}
