import { toCartesian, toSpherical, getNorthVector } from "../../geo-utils";
import getGrid from "../../plates-model/grid";
import { BoundaryType, IBoundaryInfo, IHotSpot } from "../../types";
import FieldStore from "../field-store";
import ModelStore from "../model-store";

const MAX_HOVER_DIST = 500; // km

function countNeighboringPlates(field: FieldStore, model: ModelStore) {
  const neighboringPlates: Record<number, boolean> = {};
  const grid = getGrid();
  const plate = field.plate;
  for (const adjId of field.adjacentFields) {
    const absolutePos = plate.absolutePosition(grid.fields[adjId].localPos);
    const neighboringField = model.topFieldAt(absolutePos);
    if (neighboringField && neighboringField.plate.id !== field.plate.id) {
      neighboringPlates[neighboringField.plate.id] = true;
    }
  }
  return Object.keys(neighboringPlates).length;
}

export function findFieldFromNeighboringPlate(field: FieldStore, model: ModelStore) {
  const grid = getGrid();
  const plate = field.plate;
  for (const adjId of field.adjacentFields) {
    const absolutePos = plate.absolutePosition(grid.fields[adjId].localPos);
    const neighboringField = model.topFieldAt(absolutePos);
    if (neighboringField && neighboringField.plate.id !== field.plate.id) {
      return neighboringField;
    }
  }
}

export function findNeighboringPlateId(field: FieldStore, model: ModelStore, otherPlateId: number) {
  const grid = getGrid();
  const plate = field.plate;
  for (const adjId of field.adjacentFields) {
    const absolutePos = plate.absolutePosition(grid.fields[adjId].localPos);
    const neighboringField = model.topFieldAt(absolutePos);
    if (neighboringField && neighboringField.plate.id === otherPlateId) {
      return neighboringField;
    }
  }
}

export function setHighlightStartingFromField(field: FieldStore, model: ModelStore, otherPlateId: number) {
  const stack: FieldStore[] = [field];
  while (stack.length > 0) {
    const f = stack.pop() as FieldStore;
    f.highlighted = true;
    f.forEachNeighbor(n => {
      if (!n.highlighted && n.boundary && findNeighboringPlateId(n, model, otherPlateId)) {
        stack.push(n);
      }
    });
  }
}

export function highlightBoundarySegment(field: FieldStore, model: ModelStore): FieldStore[] {
  const fieldFromNeighboringPlate = findFieldFromNeighboringPlate(field, model);
  if (fieldFromNeighboringPlate) {
    setHighlightStartingFromField(field, model, fieldFromNeighboringPlate.plate.id);
    setHighlightStartingFromField(fieldFromNeighboringPlate, model, field.plate.id);
    return [field, fieldFromNeighboringPlate];
  }
  return [];
}

export function unhighlightBoundary(field: FieldStore) {
  const stack: FieldStore[] = [field];

  while (stack.length > 0) {
    const f = stack.pop() as FieldStore;
    f.highlighted = false;
    f.forEachNeighbor(n => {
      if (n.highlighted && n.boundary) {
        stack.push(n);
      }
    });
  }
}

export function getBoundaryInfo(field: FieldStore, otherField: FieldStore): IBoundaryInfo | undefined {
  const polarCapField = field.plate.isPolarCap
                          ? field
                          : otherField.plate.isPolarCap
                              ? otherField
                              : undefined;
  const orientation = polarCapField?.plate.center
                        ? polarCapField.plate.center.y > 0
                            ? "northern-latitudinal"
                            : "southern-latitudinal"
                        : "longitudinal";
  let fields: [FieldStore, FieldStore] = [field, otherField];
  let type: BoundaryType | undefined = undefined;
  if (polarCapField) {
    // latitudinal boundary
    const nonCapField = field === polarCapField ? otherField : field;
    // Order fields from north to south.
    fields = orientation === "northern-latitudinal"
              ? [polarCapField, nonCapField]
              : [nonCapField, polarCapField];

    if (polarCapField.plate.hotSpot.force.length() > 0) {
      const { lat, lon } = toSpherical(polarCapField.plate.hotSpot.position);
      const northVec = getNorthVector(lat, lon);
      const angleToNorth = polarCapField.plate.hotSpot.force.clone().angleTo(northVec);
      // The angle is 0 when the force is facing north and Math.PI when it's facing south.
      const isForceFacingNorth = angleToNorth < Math.PI * 0.5;
      type = orientation === "northern-latitudinal"
              ? (isForceFacingNorth ? "divergent" : "convergent")
              : (isForceFacingNorth ? "convergent" : "divergent");
    }
  } else {
    // longitudinal boundary
    const platePos = toSpherical(field.plate.center);
    const otherPlatePos = toSpherical(otherField.plate.center);
    // Order fields from west to east.
    fields = platePos.lon < otherPlatePos.lon
              ? [otherField, field]
              : [field, otherField];

    const westernField = fields[0];
    if (westernField.plate.hotSpot.force.length() > 0) {
      const { lat, lon } = toSpherical(westernField.plate.hotSpot.position);
      const rotationAxis = westernField.plate.hotSpot.position.clone().normalize();
      const westVec = getNorthVector(lat, lon).applyAxisAngle(rotationAxis, 0.5 * Math.PI);
      const angleToWest = westernField.plate.hotSpot.force.clone().angleTo(westVec);
      // The angle is 0 when the force is facing west and Math.PI when it's facing east.
      const isForceFacingWest = angleToWest < Math.PI * 0.5;
      type = isForceFacingWest ? "divergent" : "convergent";
    }
  }
  return { orientation, fields, type };
}

export function convertBoundaryTypeToHotSpots(boundaryInfo: IBoundaryInfo): IHotSpot[] {
  const [field0, field1] = boundaryInfo.fields || [];
  const type = boundaryInfo.type;
  switch (boundaryInfo.orientation) {
  case "northern-latitudinal":
    if (field0) {
      const latLon = toSpherical(field0.absolutePos);
      const lat = latLon.lat + 0.15;
      const lon = latLon.lon;
      const newPos = toCartesian([lat, lon]);
      const rotationAxis = newPos.clone().normalize();
      const northVec = getNorthVector(lat, lon);
      const force = type === "convergent" ? northVec.applyAxisAngle(rotationAxis, Math.PI) : northVec;
      return [{ position: newPos, force }];
    }
    break;
  case "longitudinal":
    if (field0 && field1) {
      const latLon0 = toSpherical(field0.absolutePos);
      const lat0 = latLon0.lat;
      // TODO: it should be adjusted for extreme lat values in a better way
      const kLonDiff = 0.2 + Math.pow(Math.abs(lat0), 2) * 0.2;
      const lon0 = latLon0.lon - kLonDiff;
      const latLon1 = toSpherical(field1.absolutePos);
      const lat1 = latLon1.lat;
      const lon1 = latLon1.lon + kLonDiff;
      const latAvg = 0.5 * (lat0 + lat1);
      const newPos0 = toCartesian([latAvg, lon0]);
      const newPos1 = toCartesian([latAvg, lon1]);
      const rotationAxis0 = newPos0.clone().normalize();
      const rotationAxis1 = newPos1.clone().normalize();
      const northVec0 = getNorthVector(latAvg, lon0);
      const northVec1 = getNorthVector(latAvg, lon1);
      const force0 = northVec0.applyAxisAngle(rotationAxis0, (type === "convergent" ? 0.5 : -0.5) * Math.PI);
      const force1 = northVec1.applyAxisAngle(rotationAxis1, (type === "convergent" ? -0.5 : 0.5) * Math.PI);
      return [{ position: newPos0, force: force0 }, { position: newPos1, force: force1 }];
    }
    break;
  case "southern-latitudinal":
    if (field1) {
      const latLon = toSpherical(field1.absolutePos);
      const lat = latLon.lat - 0.15;
      const lon = latLon.lon;
      const newPos = toCartesian([lat, lon]);
      const rotationAxis = newPos.clone().normalize();
      const northVec = getNorthVector(lat, lon);
      const force = type === "convergent" ? northVec : northVec.applyAxisAngle(rotationAxis, Math.PI);
      return [{ position: newPos, force }];
    }
    break;
  }
  return [];
}

export function findBoundaryFieldAround(field: FieldStore | null, model: ModelStore) {
  if (!field) {
    return null;
  }
  const fieldDiameterInKm = getGrid().fieldDiameterInKm;
  const queue: FieldStore[] = [field];
  const processed: Record<number, boolean> = {
    [field.id]: true
  };
  const dist: Record<number, number> = {
    [field.id]: 0
  };

  while (queue.length > 0) {
    const f = queue.shift() as FieldStore;
    // If field has more than 1 neighboring plate, it means it's a corner between 3 plates.
    // This point is ambiguous, so look for another one.
    if (f.boundary && countNeighboringPlates(f, model) === 1) {
      return f;
    }
    f.forEachNeighbor(n => {
      if (!processed[n.id] && dist[f.id] + fieldDiameterInKm < MAX_HOVER_DIST) {
        processed[n.id] = true;
        dist[n.id] = dist[f.id] + fieldDiameterInKm;
        queue.push(n);
      }
    });
  }
  return null;
}
