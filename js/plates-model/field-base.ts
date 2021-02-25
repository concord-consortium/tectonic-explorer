import * as THREE from "three";
import getGrid from "./grid";
import PlateBase from "./plate-base";

// Common functionality used by Field and FieldStore.
export default class FieldBase {
  _id: number;
  adjacentFields: number[]; // ids
  localPos: THREE.Vector3;
  plate: PlateBase;

  constructor(id: number, plate: PlateBase) {
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
}
