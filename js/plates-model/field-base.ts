import getGrid from "./grid";
import PlateBase from "./plate-base";

// Common functionality used by Field and FieldStore.
export default class FieldBase {
  _id: string;
  adjacentFields: any;
  localPos: any;
  plate: PlateBase;

  constructor(id: string, plate: PlateBase) {
    const grid = getGrid();
    this._id = id;
    this.plate = plate;
    this.localPos = grid.fields[id].localPos;
    this.adjacentFields = grid.fields[id].adjacentFields;
  }

  set id(newId) {
    const grid = getGrid();
    this._id = newId;
    this.localPos = grid.fields[newId].localPos;
    this.adjacentFields = grid.fields[newId].adjacentFields;
  }

  get id() {
    return this._id;
  }

  get linearVelocity() {
    return this.plate.linearVelocity(this.absolutePos);
  }

  get absolutePos() {
    return this.plate.absolutePosition(this.localPos);
  }
}
