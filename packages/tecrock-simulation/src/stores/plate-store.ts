import * as THREE from "three";
import { observable, makeObservable, action } from "mobx";
import PlateBase from "../plates-model/plate-base";
import FieldStore from "./field-store";
import { IPlateOutput } from "../plates-model/model-output";

export default class PlateStore extends PlateBase<FieldStore> {
  // Note that observable values need to have initial values, otherwise updates won't be detected by observers.
  // It might be a MobX bug or it's described somewhere in its docs.
  @observable hue = 0;
  @observable density = 0;
  @observable visible = true;
  // Fields and their properties aren't observable, as it would be too slow. Observable properties are very slow to write
  // and read. There are thousands of fields, so it would have huge impact on performance. Instead, provide a general
  // flag that can be observed. When it's changed, the view code will trigger its render methods and read non-observable
  // properties manually.
  @observable dataUpdateID = 0;

  // Properties below could be observable, but so far there's no need for that.
  id: number;
  quaternion = new THREE.Quaternion();
  angularVelocity = new THREE.Vector3();
  center = new THREE.Vector3();
  hotSpot = { position: new THREE.Vector3(), force: new THREE.Vector3() };
  fields = new Map<number, FieldStore>();

  constructor(id: number) {
    super();
    makeObservable(this);
    this.id = id;
  }

  get isPolarCap() {
    return Math.abs(this.center.y) > 0.9;
  }

  handleDataFromWorker(data: IPlateOutput) {
    // THREE.Quaternion is serialized to {_x: ..., _y: ..., _z: ..., _w: ...} format.
    const serializedQuaternion = data.quaternion as any;
    this.quaternion.set(serializedQuaternion._x, serializedQuaternion._y, serializedQuaternion._z, serializedQuaternion._w);
    this.angularVelocity.set(data.angularVelocity.x, data.angularVelocity.y, data.angularVelocity.z);
    if (data.hotSpot) {
      this.hotSpot.position.copy(data.hotSpot.position);
      this.hotSpot.force.copy(data.hotSpot.force);
    }
    if (data.fields) {
      const fieldsData = data.fields;
      const fieldAlive: Record<string, boolean> = {};
      fieldsData.id.forEach((id: number, idx: number) => {
        fieldAlive[id] = true;
        let fieldStore = this.fields.get(id);
        if (!fieldStore) {
          fieldStore = new FieldStore(id, this);
          this.fields.set(id, fieldStore);
        }
        fieldStore.handleDataFromWorker(idx, fieldsData);
      });
      // Remove fields that are no longer existing in the original model.
      this.fields.forEach(field => {
        if (!fieldAlive[field.id]) {
          this.fields.delete(field.id);
        }
      });
    }
    if (data.density != null) {
      this.density = data.density;
    }
    if (data.hue != null) {
      this.hue = data.hue;
    }
    if (data.center != null) {
      this.center = data.center;
    }
    this.rerender();
  }

  @action.bound rerender() {
    // Update just one observable property.
    this.dataUpdateID += 1;
  }
}
