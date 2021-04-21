import getGrid from "./grid";
import PlateBase from "./plate-base";
import Field, { ISerializedField } from "./field";
import Plate from "./plate";

export interface ISerializedSubplate {
  id: string;
  fields: ISerializedField[];
}

export default class Subplate extends PlateBase<Field> {
  id: string;
  plate: Plate;
  fields: Map<number, Field>;
  isSubplate = true as const;

  constructor(plate: Plate) {
    super();
    this.id = plate.id + "-sub";
    this.fields = new Map<number, Field>();
    this.plate = plate;
  }

  serialize(): ISerializedSubplate {
    return {
      id: this.id,
      fields: Array.from(this.fields.values()).map(field => field.serialize())
    };
  }

  static deserialize(props: ISerializedSubplate, plate: Plate) {
    const subplate = new Subplate(plate);
    props.fields.forEach(serializedField => {
      const field = Field.deserialize(serializedField, subplate);
      subplate.fields.set(field.id, field);
    });
    return subplate;
  }

  get density() {
    return this.plate.density + 0.01;
  }

  get quaternion() {
    return this.plate.quaternion;
  }

  get angularVelocity() {
    return this.plate.angularVelocity;
  }

  addField(field: Omit<Field, "id" | "plate">) {
    const newId = getGrid().nearestFieldId(this.localPosition(field.absolutePos));
    if (!this.plate.fields.has(newId)) {
      return;
    }
    const newField = field.clone(newId, this);
    this.addExistingField(newField);
  }

  addExistingField(field: Field) {
    field.plate = this;
    this.fields.set(field.id, field);
  }

  deleteField(id: number) {
    this.fields.delete(id);
  }
}
