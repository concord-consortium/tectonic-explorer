import * as THREE from "three";
import getGrid from "./grid";
import config from "../config";
import PlateBase from "./plate-base";
import Subplate from "./subplate";
import Field from "./field";
import { serialize, deserialize } from "../utils";

let __id = 0;
function getId() {
  return __id++;
}
export function resetIds() {
  __id = 0;
}

const HOT_SPOT_TORQUE_DECREASE = config.constantHotSpots ? 0 : 0.2;
const MIN_PLATE_SIZE = 100000; // km, roughly the size of a plate label

export default class Plate extends PlateBase {
  adjacentFields: Map<string, Field>;
  center: any;
  density: number;
  hotSpot: any;
  hue: any;
  id: any;
  invMomentOfInertia: any;
  mass: any;
  subplate: Subplate;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  fields: Map<string, Field>;
  isSubplate: false;

  constructor({ density, hue }: any) {
    super();
    this.id = getId();
    // Decides whether plate goes under or above another plate while subducting (ocean-ocean).
    this.density = density;
    // Base color / hue of the plate used to visually identify it.
    this.hue = hue;
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

  get serializableProps() {
    return ["quaternion", "angularVelocity", "id", "hue", "density", "mass", "invMomentOfInertia", "center", "hotSpot"];
  }

  serialize() {
    const props: any = serialize(this);
    props.fields = Array.from(this.fields.values()).map(field => field.serialize());
    props.adjacentFields = Array.from(this.adjacentFields.values()).map(field => field.serialize());
    props.subplate = this.subplate?.serialize();
    return props;
  }

  static deserialize(props: any) {
    const plate = new Plate({});
    deserialize(plate, props);
    props.fields.forEach((serializedField: any) => {
      const field = Field.deserialize(serializedField, plate);
      plate.fields.set(field.id, field);
    });
    props.adjacentFields.forEach((serializedField: any) => {
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
    this.fields.forEach((field: any) => {
      totalTorque.add(field.torque);
    });
    return totalTorque.applyMatrix3(this.invMomentOfInertia);
  }

  updateCenter() {
    const safeFields: Record<string, Field> = {};
    const safeSum = new THREE.Vector3();
    let safeArea = 0;
    this.fields.forEach((field: any) => {
      if (!field.subduction) {
        let safe = true;
        // Some subducting fields do not get marked because they move so slowly
        // Ignore fields adjacent to subducting fields just to be safe
        field.forEachNeighbour((neighbor: any) => {
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
    this.fields.forEach((field: any) => {
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

  updateHotSpot(timestep: any) {
    const len = this.hotSpot.force.length();
    if (len > 0) {
      this.hotSpot.force.setLength(Math.max(0, len - timestep * HOT_SPOT_TORQUE_DECREASE));
    }
  }

  setHotSpot(position: any, force: any) {
    this.hotSpot = { position, force };
  }

  setDensity(density: any) {
    this.density = density;
  }

  removeUnnecessaryFields() {
    this.fields.forEach((f: any) => {
      if (!f.alive) {
        this.deleteField(f.id);
      }
    });
  }

  addField(props: any) {
    props.plate = this;
    const field = new Field(props);
    this.addExistingField(field);
  }

  addFieldAt(props: any, absolutePos: any) {
    const localPos = this.localPosition(absolutePos);
    const id = getGrid().nearestFieldId(localPos);
    if (!this.fields.has(id)) {
      props.id = id;
      this.addField(props);
    }
  }

  addExistingField(field: any) {
    const id = field.id;
    field.plate = this;
    this.fields.set(id, field);
    if (this.adjacentFields.has(id)) {
      this.adjacentFields.delete(id);
    }
    field.adjacentFields.forEach((adjFieldId: any) => {
      if (!this.fields.has(adjFieldId)) {
        this.addAdjacentField(adjFieldId);
      } else {
        const adjField = this.fields.get(adjFieldId);
        if (adjField) {
          adjField.boundary = adjField.isBoundary() ? true : undefined;
        }
      }
    });
    field.boundary = field.isBoundary() ? true : undefined;
  }

  deleteField(id: any) {
    const field = this.fields.get(id);
    if (!field) {
      return;
    }
    this.fields.delete(id);
    this.subplate.deleteField(id);
    this.addAdjacentField(id);
    field.adjacentFields.forEach((adjFieldId: any) => {
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

  addAdjacentField(id: any) {
    if (!this.adjacentFields.has(id)) {
      const newField = new Field({ id, plate: this });
      if (newField.isAdjacentField()) {
        this.adjacentFields.set(id, newField);
      }
    }
  }

  neighboursCount(absolutePos: any) {
    const localPos = this.localPosition(absolutePos);
    const id = getGrid().nearestFieldId(localPos);
    let count = 0;
    getGrid().fields[id].adjacentFields.forEach((adjId: any) => {
      if (this.fields.has(adjId)) {
        count += 1;
      }
    });
    return count;
  }

  calculateContinentBuffers() {
    const grid = getGrid();
    const queue: any = [];
    const dist: Record<string, number> = {};
    const getDist = (field: any) => {
      const id = field.id;
      if (dist[id] !== undefined) {
        return dist[id];
      }
      return Infinity;
    };
    this.forEachField((field: any) => {
      field.isContinentBuffer = false;
      if (field.isContinent) {
        field.forEachNeighbour((adjField: any) => {
          if (adjField.isOcean && getDist(adjField) > grid.fieldDiameterInKm) {
            dist[adjField.id] = grid.fieldDiameterInKm;
            queue.push(adjField);
          }
        });
      }
    });
    while (queue.length > 0) {
      const field = queue.shift();
      field.isContinentBuffer = true;
      const newDist = getDist(field) + grid.fieldDiameterInKm;
      if (newDist < config.continentBufferWidth) {
        field.forEachNeighbour((adjField: any) => {
          if (adjField.isOcean && getDist(adjField) > newDist) {
            dist[adjField.id] = newDist;
            queue.push(adjField);
          }
        });
      }
    }
  }

  mergeIsland(island: any, collidingField: any) {
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

  addToSubplate(field: any) {
    field.alive = false;
    this.subplate.addField(field);
  }

  // Returns fields adjacent to the whole plate which will be probably added to it soon (around divergent boundaries).
  getVisibleAdjacentFields() {
    const result: any = [];
    this.adjacentFields.forEach((field: any) => {
      if (field.noCollisionDist > 0) {
        result.push(field);
      }
    });
    return result;
  }
}
