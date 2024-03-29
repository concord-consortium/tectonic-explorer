import * as THREE from "three";
import getGrid from "./grid";
import config from "../config";
import PlateBase from "./plate-base";
import Subplate, { ISerializedSubplate } from "./subplate";
import Field, { IFieldOptions, ISerializedField } from "./field";
import { IMatrix3Array, IQuaternionArray, IVec3Array } from "../types";
import PlateGroup, { ISerializedPlateGroup } from "./plate-group";

// The stronger initial plate force, the sooner it should be decreased.
const HOT_SPOT_TORQUE_DECREASE = config.constantHotSpots ? 0 : 0.2 * config.userForce;
const MIN_PLATE_SIZE = 100000; // km, roughly the size of a plate label

interface IOptions {
  id: number;
  density?: number;
  hue?: number;
}

// See: https://app.zeplin.io/project/60c9c0d5060353bd2bb10172/screen/62768bda825a8d13749065fc
// When these values get updated, remember to update arrows colors in boundary-config-dialog.less.
// Other colors (plate labels, 3D arrows) will automatically pick up colors from this array.
export const plateHues = [
  29, 186, 277, 47, 330, // up to 5 initial plates used by basic presets
  71, 205, 166, 258, 359 // 5 extra colors for plates that might be created during simulation (plate division)
];

export interface ISerializedPlate {
  id: number;
  quaternion: IQuaternionArray;
  angularVelocity: IVec3Array;
  hue: number;
  density: number;
  mass: number;
  momentOfInertia: IMatrix3Array;
  invMomentOfInertia: IMatrix3Array;
  center: null | IVec3Array;
  hotSpot: {
    position: IVec3Array;
    force: IVec3Array;
  };
  fields: ISerializedField[];
  adjacentFields: ISerializedField[];
  subplate: ISerializedSubplate;
  plateGroup: ISerializedPlateGroup | null;
}

export default class Plate extends PlateBase<Field> {
  id: number;
  density: number;
  hue: number;
  adjacentFields: Map<number, Field>;
  center: null | THREE.Vector3;
  invMomentOfInertia: THREE.Matrix3;
  momentOfInertia: THREE.Matrix3;
  mass: number;
  subplate: Subplate;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  fields: Map<number, Field>;
  isSubplate = false;
  plateGroup: PlateGroup | null;
  hotSpot: {
    position: THREE.Vector3;
    force: THREE.Vector3;
  };

  constructor({ id, density, hue }: IOptions) {
    super();
    this.id = id;
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = density || 0;
    // Base color / hue of the plate used to visually identify it.
    this.hue = hue || 0;
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3();
    this.fields = new Map();
    this.adjacentFields = new Map();
    // Physics properties:
    this.mass = 0;
    this.invMomentOfInertia = new THREE.Matrix3();
    this.momentOfInertia = new THREE.Matrix3();
    this.center = null;
    // Torque / force that is pushing plate. It might be constant or decrease with time ().
    this.hotSpot = { position: new THREE.Vector3(0, 0, 0), force: new THREE.Vector3(0, 0, 0) };
    // Subplate is a container for some additional fields attached to this plate.
    // At this point mostly fields that were subducting under and were detached from the original plate.
    this.subplate = new Subplate(this);
    this.plateGroup = null;
  }

  serialize(): ISerializedPlate {
    return {
      id: this.id,
      quaternion: this.quaternion.toArray(),
      angularVelocity: this.angularVelocity.toArray(),
      hue: this.hue,
      density: this.density,
      mass: this.mass,
      momentOfInertia: this.momentOfInertia.toArray(),
      invMomentOfInertia: this.invMomentOfInertia.toArray(),
      center: this.center?.toArray() || null,
      hotSpot: {
        force: this.hotSpot.force.toArray(),
        position: this.hotSpot.position.toArray()
      },
      fields: Array.from(this.fields.values()).map(field => field.serialize()),
      adjacentFields: Array.from(this.adjacentFields.values()).map(field => field.serialize()),
      subplate: this.subplate.serialize(),
      plateGroup: this.plateGroup?.serialize() || null
    };
  }

  static deserialize(props: ISerializedPlate) {
    const plate = new Plate({ id: props.id });
    plate.quaternion = (new THREE.Quaternion()).fromArray(props.quaternion);
    plate.angularVelocity = (new THREE.Vector3()).fromArray(props.angularVelocity);
    plate.hue = props.hue;
    plate.density = props.density;
    plate.mass = props.mass;
    plate.momentOfInertia = (new THREE.Matrix3()).fromArray(props.momentOfInertia);
    plate.invMomentOfInertia = (new THREE.Matrix3()).fromArray(props.invMomentOfInertia);
    plate.center = props.center && (new THREE.Vector3()).fromArray(props.center);
    plate.hotSpot.force = (new THREE.Vector3()).fromArray(props.hotSpot.force);
    plate.hotSpot.position = (new THREE.Vector3()).fromArray(props.hotSpot.position);
    props.fields.forEach((serializedField: ISerializedField) => {
      const field = Field.deserialize(serializedField, plate);
      plate.fields.set(field.id, field);
    });
    props.adjacentFields.forEach((serializedField: ISerializedField) => {
      const field = Field.deserialize(serializedField, plate);
      plate.adjacentFields.set(field.id, field);
    });
    plate.subplate = props.subplate && Subplate.deserialize(props.subplate, plate);
    plate.plateGroup = null; // this needs to be deserialized by parent (model) that has access to all the plates
    return plate;
  }

  // It depends on current angular velocity and velocities of other, colliding plates.
  // Note that this is pretty expensive to calculate, so if used much, the current value should be cached.
  get totalTorque() {
    const totalTorque = this.hotSpot.position.clone().cross(this.hotSpot.force);
    this.fields.forEach((field: Field) => {
      totalTorque.add(field.torque);
    });
    return totalTorque;
  }

  get angularAcceleration() {
    if (this.plateGroup) {
      return this.plateGroup.angularAcceleration;
    }
    return this.totalTorque.applyMatrix3(this.invMomentOfInertia);
  }

  mergedWith(anotherPlate: Plate) {
    if (!this.plateGroup || !anotherPlate.plateGroup) {
      return false;
    }
    return this.plateGroup === anotherPlate.plateGroup;
  }

  updateCenter() {
    const safeFields: Record<string, Field> = {};
    const safeSum = new THREE.Vector3();
    let safeArea = 0;
    this.fields.forEach((field: Field) => {
      if (!field.subduction) {
        let safe = true;
        // Some subducting fields do not get marked because they move so slowly
        // Ignore fields adjacent to subducting fields just to be safe
        field.forEachNeighbor((neighbor: Field) => {
          if (neighbor.subduction) {
            safe = false;
          }
        });
        if (safe) {
          safeFields[field.id] = field;
          safeSum.add(field.absolutePos);
          safeArea += field.area;
        }
      }
    });
    if (safeArea < MIN_PLATE_SIZE) {
      // If the visible area of a plate is too small, don't bother labelling
      this.center = new THREE.Vector3();
    } else {
      // Otherwise, use the field nearest the center
      const geographicCenter = safeSum.normalize();
      let closestPoint = new THREE.Vector3(0, 0, 0);
      let minDist = Number.MAX_VALUE;
      for (const id in safeFields) {
        const field = safeFields[id];
        const dist = field.absolutePos.distanceTo(geographicCenter);
        if (dist < minDist) {
          closestPoint = field.absolutePos;
          minDist = dist;
        }
      }
      this.center = closestPoint;
    }
  }

  updateInertiaTensor() {
    this.mass = 0;
    let ixx = 0;
    let iyy = 0;
    let izz = 0;
    let ixy = 0;
    let ixz = 0;
    let iyz = 0;
    this.fields.forEach((field: Field) => {
      const mass = field.mass;
      const p = field.absolutePos;
      ixx += mass * (p.y * p.y + p.z * p.z);
      iyy += mass * (p.x * p.x + p.z * p.z);
      izz += mass * (p.x * p.x + p.y * p.y);
      ixy -= mass * p.x * p.y;
      ixz -= mass * p.x * p.z;
      iyz -= mass * p.y * p.z;
      this.mass += mass;
    });
    this.momentOfInertia = new THREE.Matrix3();
    this.momentOfInertia.set(ixx, ixy, ixz, ixy, iyy, iyz, ixz, iyz, izz);
    this.invMomentOfInertia = new THREE.Matrix3();
    this.invMomentOfInertia.copy(this.momentOfInertia).invert();
  }

  updateHotSpot(timestep: number) {
    const len = this.hotSpot.force.length();
    if (len > 0) {
      this.hotSpot.force.setLength(Math.max(0, len - timestep * HOT_SPOT_TORQUE_DECREASE));
    }
  }

  setHotSpot(position: THREE.Vector3, force: THREE.Vector3) {
    this.hotSpot = { position, force };
  }

  setDensity(density: number) {
    this.density = density;
  }

  removeUnnecessaryFields() {
    this.fields.forEach((f: Field) => {
      if (!f.alive) {
        this.deleteField(f.id);
      }
    });
  }

  addField(props: Omit<IFieldOptions, "plate">) {
    const field = new Field({ ...props, plate: this });
    this.addExistingField(field);
    return field;
  }

  addFieldAt(props: Omit<IFieldOptions, "id" | "plate">, absolutePos: THREE.Vector3) {
    const localPos = this.localPosition(absolutePos);
    const id = getGrid().nearestFieldId(localPos);
    if (!this.fields.has(id)) {
      return this.addField({ ...props, id });
    }
  }

  addExistingField(field: Field) {
    const id = field.id;
    field.plate = this;
    this.fields.set(id, field);
    if (this.adjacentFields.has(id)) {
      this.adjacentFields.delete(id);
    }
    field.adjacentFields.forEach((adjFieldId: number) => {
      if (!this.fields.has(adjFieldId)) {
        this.addAdjacentField(adjFieldId);
      } else {
        const adjField = this.fields.get(adjFieldId);
        if (adjField) {
          adjField.boundary = adjField.isBoundary();
        }
      }
    });
    field.boundary = field.isBoundary();
    return field;
  }

  deleteField(id: number) {
    const field = this.fields.get(id);
    if (!field) {
      return;
    }
    this.fields.delete(id);
    this.subplate.deleteField(id);
    this.addAdjacentField(id);
    field.adjacentFields.forEach((adjFieldId: number) => {
      let adjField = this.adjacentFields.get(adjFieldId);
      if (adjField && !adjField.isAdjacentField()) {
        this.adjacentFields.delete(adjFieldId);
      }
      adjField = this.fields.get(adjFieldId);
      if (adjField) {
        adjField.boundary = true;
      }
    });
  }

  addAdjacentField(id: number) {
    if (!this.adjacentFields.has(id)) {
      const newField = new Field({ id, plate: this, adjacent: true });
      if (newField.isAdjacentField()) {
        this.adjacentFields.set(id, newField);
      }
    }
  }

  neighborsCount(absolutePos: THREE.Vector3) {
    const localPos = this.localPosition(absolutePos);
    const id = getGrid().nearestFieldId(localPos);
    let count = 0;
    getGrid().fields[id].adjacentFields.forEach((adjId: number) => {
      if (this.fields.has(adjId)) {
        count += 1;
      }
    });
    return count;
  }

  calculateContinentBuffers() {
    const grid = getGrid();
    const queue: Field[] = [];
    const dist: Record<string, number> = {};
    const getDist = (field: Field) => {
      const id = field.id;
      if (dist[id] !== undefined) {
        return dist[id];
      }
      return Infinity;
    };
    this.forEachField((field: Field) => {
      field.isContinentBuffer = false;
      if (field.continentalCrust) {
        field.forEachNeighbor((adjField: Field) => {
          if (adjField.oceanicCrust && getDist(adjField) > grid.fieldDiameterInKm) {
            dist[adjField.id] = grid.fieldDiameterInKm;
            queue.push(adjField);
          }
        });
      }
    });
    while (queue.length > 0) {
      const field = queue.shift() as Field;
      field.isContinentBuffer = true;
      const newDist = getDist(field) + grid.fieldDiameterInKm;
      if (newDist < config.continentBufferWidth) {
        field.forEachNeighbor((adjField: Field) => {
          if (adjField.oceanicCrust && getDist(adjField) > newDist) {
            dist[adjField.id] = newDist;
            queue.push(adjField);
          }
        });
      }
    }
  }

  addToSubplate(field: Field) {
    field.alive = false;
    this.subplate.addField(field);
  }

  // Returns fields adjacent to the whole plate which will be probably added to it soon (around divergent boundaries).
  getVisibleAdjacentFields() {
    const result: Field[] = [];
    this.adjacentFields.forEach((field: Field) => {
      if (field.noCollisionDist > 0) {
        result.push(field);
      }
    });
    return result;
  }

  sortFields() {
    // Sort fields by ID. Map traversal follows insertion order.
    // This is not necessary, but it lets us test model better. Quaternion and physical properties are often calculated
    // by traversing all the fields. Order of this traverse might influence micro numerical errors that can create
    // visible differences in a longer run. Example of a place where it matters: plate-division-merge.test.ts
    this.fields = new Map<number, Field>(Array.from(this.fields.entries()).sort((a, b) => a[0] - b[0]));
    this.adjacentFields = new Map<number, Field>(Array.from(this.adjacentFields.entries()).sort((a, b) => a[0] - b[0]));
  }
}
