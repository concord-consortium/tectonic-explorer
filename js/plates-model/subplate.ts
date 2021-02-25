import getGrid from "./grid";
import PlateBase from "./plate-base";
import Field from "./field";
import { serialize, deserialize } from "../utils";
import Plate from "./plate";

export default class Subplate extends PlateBase {
    id: string;
    isSubplate: boolean;
    plate: Plate;
    fields: Map<number, Field>;

    constructor(plate: any) {
      super();
      this.id = plate.id + "-sub";
      this.fields = new Map();
      this.plate = plate;
      this.isSubplate = true;
    }

    get serializableProps() {
      return ["id"];
    }

    serialize() {
      const props: any = serialize(this);
      props.fields = Array.from(this.fields.values()).map(field => field.serialize());
      return props;
    }

    static deserialize(props: any, plate: any) {
      const subplate = new Subplate(plate);
      deserialize(subplate, props);
      props.fields.forEach((serializedField: any) => {
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

    addField(field: any) {
      const newId = getGrid().nearestFieldId(this.localPosition(field.absolutePos));
      if (!this.plate.fields.has(newId)) {
        return;
      }
      const newField = field.clone();
      newField.id = newId;
      newField.plate = this;
      this.fields.set(newId, newField);
    }

    deleteField(id: any) {
      this.fields.delete(id);
    }
}
