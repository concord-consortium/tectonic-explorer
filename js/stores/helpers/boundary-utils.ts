import config from "../../config";
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

export function getBoundaryInfo(field: FieldStore, otherField: FieldStore, model: ModelStore): IBoundaryInfo | undefined {
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
      const angleToNorth = polarCapField.plate.hotSpot.force.angleTo(northVec);
      // The angle is 0 when the force is facing north and Math.PI when it's facing south.
      const isForceFacingNorth = angleToNorth < Math.PI * 0.5;
      type = orientation === "northern-latitudinal"
              ? (isForceFacingNorth ? "divergent" : "convergent")
              : (isForceFacingNorth ? "convergent" : "divergent");
    }
  } else {
    // longitudinal boundary
    const { lat, lon } = toSpherical(field.absolutePos);
    const fieldRotationAxis = field.absolutePos.clone().normalize();
    const kTestVectorLen = 0.1; // the whole planet has radius 1.0, so 0.1 seems safe
    const westTestVec = getNorthVector(lat, lon).setLength(kTestVectorLen).applyAxisAngle(fieldRotationAxis, 0.5 * Math.PI);
    const eastTestVec = getNorthVector(lat, lon).setLength(kTestVectorLen).applyAxisAngle(fieldRotationAxis, -0.5 * Math.PI);
    const westTestField = model.topFieldAt(field.absolutePos.clone().add(westTestVec));
    const eastTestField = model.topFieldAt(field.absolutePos.clone().add(eastTestVec));
    fields = [field, otherField];
    const plateIds = [field.plate.id, otherField.plate.id];
    const westIndex = westTestField && plateIds.indexOf(westTestField?.plate.id);
    const eastIndex = eastTestField && plateIds.indexOf(eastTestField?.plate.id);
    // Order fields from west to east
    fields = (westIndex != null) && (westIndex >= 0)
              ? [fields[westIndex], fields[1-westIndex]]
              : (eastIndex != null) && (eastIndex >= 0)
                ? [fields[1-eastIndex], fields[eastIndex]]
                : fields;

    const westField = fields[0];
    const eastField = fields[1];
    if (westField.plate.hotSpot.force.length() > 0 && eastField.plate.hotSpot.force.length() > 0) {
      const westLatLon = toSpherical(westField.plate.hotSpot.position);
      const eastLatLon = toSpherical(eastField.plate.hotSpot.position);
      const westRotationAxis = westField.plate.hotSpot.position.clone().normalize();
      const eastRotationAxis = eastField.plate.hotSpot.position.clone().normalize();
      const westVec = getNorthVector(westLatLon.lat, westLatLon.lon).applyAxisAngle(westRotationAxis, 0.5 * Math.PI);
      const eastVec = getNorthVector(eastLatLon.lat, eastLatLon.lon).applyAxisAngle(eastRotationAxis, -0.5 * Math.PI);
      // The angle is 0 when the force is facing west and Math.PI when it's facing east.
      const isWestForceFacingWest = westField.plate.hotSpot.force.angleTo(westVec) < Math.PI * 0.5;
      // The angle is 0 when the force is facing east and Math.PI when it's facing west.
      const isEastForceFacingEast = eastField.plate.hotSpot.force.angleTo(eastVec) < Math.PI * 0.5;
      if (isWestForceFacingWest && isEastForceFacingEast) {
        type = "divergent";
      }
      if (!isWestForceFacingWest && !isEastForceFacingEast) {
        type = "convergent";
      }
      // There are more possibilities, for example !isWestForceFacingWest && isEastForceFacingEast, but cases like
      // that should not be handled here and leave the type undefined.
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
      force.setLength(config.userForce);
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
      force0.setLength(config.userForce);
      force1.setLength(config.userForce);
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
      force.setLength(config.userForce);
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
