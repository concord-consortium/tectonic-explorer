import * as THREE from "three";
import getGrid from "./grid";
import config from "../config";
import PlateBase from "./plate-base";
import Subplate, { ISerializedSubplate } from "./subplate";
import Field, { IFieldOptions, ISerializedField } from "./field";
import { IMatrix3Array, IQuaternionArray, IVec3Array } from "../types";

let __id = 0;
function getId() {
  return __id++;
}
export function resetIds() {
  __id = 0;
}

const HOT_SPOT_TORQUE_DECREASE = config.constantHotSpots ? 0 : 0.2;
const MIN_PLATE_SIZE = 100000; // km, roughly the size of a plate label

interface IOptions {
  density?: number;
  hue?: number;
}

export interface ISerializedPlate {
  id: number;
  quaternion: IQuaternionArray;
  angularVelocity: IVec3Array;
  hue: number;
  density: number;
  mass: number;
  invMomentOfInertia: IMatrix3Array;
  center: null | IVec3Array;
  hotSpot: {
    position: IVec3Array;
    force: IVec3Array;
  };
  fields: ISerializedField[];
  adjacentFields: ISerializedField[];
  subplate: ISerializedSubplate;
}

export default class Plate extends PlateBase<Field> {
  id: number;
  density: number;
  hue: number;
  adjacentFields: Map<number, Field>;
  center: null | THREE.Vector3;
  invMomentOfInertia: THREE.Matrix3;
  mass: number;
  subplate: Subplate;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  fields: Map<number, Field>;
  isSubplate = false;
  hotSpot: {
    position: THREE.Vector3;
    force: THREE.Vector3;
  };

  constructor({ density, hue }: IOptions) {
    super();
    this.id = getId();
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
    this.center = null;
    // Torque / force that is pushing plate. It might be constant or decrease with time ().
    this.hotSpot = { position: new THREE.Vector3(0, 0, 0), force: new THREE.Vector3(0, 0, 0) };
    // Subplate is a container for some additional fields attached to this plate.
    // At this point mostly fields that were subducting under and were detached from the original plate.
    this.subplate = new Subplate(this);
  }

  serialize(): ISerializedPlate {
    return {
      id: this.id,
      quaternion: this.quaternion.toArray(),
      angularVelocity: this.angularVelocity.toArray(),
      hue: this.hue,
      density: this.density,
      mass: this.mass,
      invMomentOfInertia: this.invMomentOfInertia.toArray(),
      center: this.center?.toArray() || null,
      hotSpot: {
        force: this.hotSpot.force.toArray(),
        position: this.hotSpot.position.toArray()
      },
      fields: Array.from(this.fields.values()).map(field => field.serialize()),
      adjacentFields: Array.from(this.adjacentFields.values()).map(field => field.serialize()),
      subplate: this.subplate.serialize()
    };
  }

  static deserialize(props: ISerializedPlate) {
    const plate = new Plate({});
    plate.id = props.id;
    plate.quaternion = (new THREE.Quaternion()).fromArray(props.quaternion);
    plate.angularVelocity = (new THREE.Vector3()).fromArray(props.angularVelocity);
    plate.hue = props.hue;
    plate.density = props.density;
    plate.mass = props.mass;
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
    return plate;
  }

  // It depends on current angular velocity and velocities of other, colliding plates.
  // Note that this is pretty expensive to calculate, so if used much, the current value should be cached.
  get angularAcceleration() {
    const totalTorque = this.hotSpot.position.clone().cross(this.hotSpot.force);
    this.fields.forEach((field: Field) => {
      totalTorque.add(field.torque);
    });
    return totalTorque.applyMatrix3(this.invMomentOfInertia);
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
        field.forEachNeighbour((neighbor: Field) => {
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
    const momentOfInertia = new THREE.Matrix3();
    momentOfInertia.set(ixx, ixy, ixz, ixy, iyy, iyz, ixz, iyz, izz);
    this.invMomentOfInertia = new THREE.Matrix3();
    this.invMomentOfInertia.getInverse(momentOfInertia);
    // When THREE.JS gets updated to version > 0.120.0:
    // this.invMomentOfInertia.copy(momentOfInertia).invert()
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
  }

  addFieldAt(props: Omit<IFieldOptions, "id" | "plate">, absolutePos: THREE.Vector3) {
    const localPos = this.localPosition(absolutePos);
    const id = getGrid().nearestFieldId(localPos);
    if (!this.fields.has(id)) {
      this.addField({ ...props, id });
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
      const newField = new Field({ id, plate: this });
      if (newField.isAdjacentField()) {
        this.adjacentFields.set(id, newField);
      }
    }
  }

  neighboursCount(absolutePos: THREE.Vector3) {
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
      if (field.isContinent) {
        field.forEachNeighbour((adjField: Field) => {
          if (adjField.isOcean && getDist(adjField) > grid.fieldDiameterInKm) {
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
        field.forEachNeighbour((adjField: Field) => {
          if (adjField.isOcean && getDist(adjField) > newDist) {
            dist[adjField.id] = newDist;
            queue.push(adjField);
          }
        });
      }
    }
  }

  mergeIsland(island: Field, collidingField: Field) {
    const perfectPosition = island.absolutePos;
    let bestFieldId = null;
    let minDist = Infinity;
    for (const adjId of collidingField.adjacentFields) {
      const adjField = this.adjacentFields.get(adjId);
      if (adjField) {
        const dist = adjField.absolutePos.distanceTo(perfectPosition);
        // neighboursCount() > 1 check is here to make sure that islands are not collected in some kind of narrow spike.
        if (dist < minDist && adjField.neighboursCount() > 1) {
          bestFieldId = adjField.id;
          minDist = dist;
        }
      }
    }
    if (bestFieldId) {
      // Sometimes island can be placed at the boundary and become a trench. Make sure that trench elevation modifier
      // is not applied to the new field.
      island.trench = false;
      this.addField({
        id: bestFieldId,
        age: island.age,
        type: "continent",
        elevation: island.elevation,
        crustThickness: island.baseCrustThickness,
        originalHue: island.plate.hue,
        marked: island.marked
      });
    }
    // Remove the old island field.
    island.alive = false;
    island.marked = false;
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
}
