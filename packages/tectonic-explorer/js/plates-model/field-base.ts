import * as THREE from "three";
import getGrid from "./grid";
import PlateBase from "./plate-base";

// Common functionality used by Field and FieldStore.
export default class FieldBase<FieldSubtype> {
  _id: number;
  adjacentFields: number[]; // ids
  localPos: THREE.Vector3;
  plate: PlateBase<FieldSubtype>;

  constructor(id: number, plate: PlateBase<FieldSubtype>) {
    const grid = getGrid();
    this._id = id;
    this.plate = plate;
    this.localPos = grid.fields[id].localPos;
    this.adjacentFields = grid.fields[id].adjacentFields;
  }

  set id(newId: number) {
    const grid = getGrid();
    this._id = newId;
    this.localPos = grid.fields[newId].localPos;
    this.adjacentFields = grid.fields[newId].adjacentFields;
  }

  get id(): number {
    return this._id;
  }

  get linearVelocity() {
    return this.plate.linearVelocity(this.absolutePos);
  }

  get absolutePos() {
    return this.plate.absolutePosition(this.localPos);
  }

  isAdjacentField() {
    // At least one adjacent field of this field belongs to the plate.
    for (const adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        return true;
      }
    }
    return false;
  }

  // Fields belonging to the parent plate.
  forEachNeighbor(callback: (field: FieldSubtype) => void) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field) {
        callback(field);
      }
    }
  }

  anyNeighbor(condition: (field: FieldSubtype) => boolean) {
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field && condition(field)) {
        return true;
      }
    }
    return false;
  }

  avgNeighbor(property: keyof FieldSubtype) {
    let val = 0;
    let count = 0;
    for (const adjId of this.adjacentFields) {
      const field = this.plate.fields.get(adjId);
      if (field) {
        // No strict type checking. Generally this function isn't very safe.
        val += field[property] as any;
        count += 1;
      }
    }
    return val / count;
  }

  // One of the neighboring fields, pointed by linear velocity vector.
  neighborAlongVector(direction: THREE.Vector3) {
    const posOfNeighbor = this.absolutePos.clone().add(direction.clone().setLength(getGrid().fieldDiameter));
    return this.plate.fieldAtAbsolutePos(posOfNeighbor);
  }

  // Number of adjacent fields that actually belong to the plate.
  neighborsCount() {
    let count = 0;
    for (const adjId of this.adjacentFields) {
      if (this.plate.fields.has(adjId)) {
        count += 1;
      }
    }
    return count;
  }
}
