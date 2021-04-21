import * as THREE from "three";
import generatePlates from "./generate-plates";
import Plate, { ISerializedPlate, resetIds } from "./plate";
import getGrid from "./grid";
import config from "../config";
import fieldsCollision from "./fields-collision";
import addRelativeMotion from "./add-relative-motion";
import dividePlate from "./divide-plate";
import eulerStep from "./physics/euler-integrator";
import rk4Step from "./physics/rk4-integrator";
import verletStep from "./physics/verlet-integrator";
import * as seedrandom from "../seedrandom";
import Field, { IFieldOptions } from "./field";
import VolcanicActivity from "./volcanic-activity";

// Limit max speed of the plate, so model doesn't look crazy.
const MAX_PLATE_SPEED = 0.02;

// How many steps between plate centers are recalculated.
const CENTER_UPDATE_INTERVAL = 15;

const MIN_RELATIVE_MOTION = 0.0015;

function sortByDensityAsc(plateA: Plate, plateB: Plate) {
  return plateA.density - plateB.density;
}

export interface ISerializedModel {
  time: number;
  stepIdx: number;
  lastPlateDivisionOrMerge: number;
  seedrandomState: any;
  plates: ISerializedPlate[];
}

export default class Model {
  stepIdx: number;
  lastPlateDivisionOrMerge: number;
  time: number;
  plates: Plate[];
  _diverged: boolean;  

  constructor(imgData: ImageData | null, initFunction: ((plates: Record<number, Plate>) => void) | null, seedrandomState?: any) {
    if (config.deterministic && seedrandomState) {
      seedrandom.initializeFromState(seedrandomState);
    } else {
      seedrandom.initialize(config.deterministic);
    }
    this.time = 0;
    this.stepIdx = 0;
    this.lastPlateDivisionOrMerge = 0;
    this.plates = [];
    resetIds();
    if (imgData) {
      // It's very important to keep plates sorted, so if some new plates will be added to this list,
      // it should be sorted again.
      this.plates = generatePlates(imgData, initFunction).sort(sortByDensityAsc);
      this.calculateDynamicProperties(false);
    }
  }

  serialize(): ISerializedModel {
    return {
      time: this.time,
      stepIdx: this.stepIdx,
      lastPlateDivisionOrMerge: this.lastPlateDivisionOrMerge,
      seedrandomState: seedrandom.getState(),
      plates: this.plates.map((plate: Plate) => plate.serialize())
    };
  }

  static deserialize(props: ISerializedModel) {
    const model = new Model(null, null, props.seedrandomState);
    model.time = props.time;
    model.stepIdx = props.stepIdx;
    model.lastPlateDivisionOrMerge = props.lastPlateDivisionOrMerge;
    model.plates = props.plates.map((serializedPlate: ISerializedPlate) => Plate.deserialize(serializedPlate));
    model.calculateDynamicProperties(false);
    return model;
  }

  getPlate(plateId: number) {
    for (const plate of this.plates) {
      if (plate.id === plateId) {
        return plate;
      }
    }
    return null;
  }

  forEachPlate(callback: (plate: Plate) => void) {
    this.plates.forEach(callback);
  }

  forEachField(callback: (field: Field) => void) {
    this.forEachPlate((plate: Plate) => plate.forEachField(callback));
  }

  // TODO simplify this function, use alternative approach.
  // Returns map of given plates property.
  getPlatesProp(property: keyof Plate) {
    const result = new Map<Plate, any>();
    this.forEachPlate((plate: Plate) => {
      result.set(plate, (plate[property] as any).clone());
    });
    return result;
  }

  // TODO simplify this function, use alternative approach.
  // Updates each plate using provided map.
  setPlatesProp(property: keyof Plate, map: Map<Plate, any>) {
    this.forEachPlate((plate: Plate) => {
      (plate[property] as any) = map.get(plate);
    });
  }

  getQuaternions() {
    return this.getPlatesProp("quaternion");
  }

  getAngularVelocities() {
    return this.getPlatesProp("angularVelocity");
  }

  getAngularAccelerations() {
    return this.getPlatesProp("angularAcceleration");
  }

  setQuaternions(map: Map<Plate, THREE.Quaternion>) {
    this.setPlatesProp("quaternion", map);
  }

  setAngularVelocities(map: Map<Plate, THREE.Vector3>) {
    this.setPlatesProp("angularVelocity", map);
  }

  setDensities(densities: Record<number, number>) {
    this.forEachPlate((plate: Plate) => {
      plate.setDensity(densities[plate.id]);
    });
    this.plates.sort(sortByDensityAsc);
  }

  get kineticEnergy() {
    // Well, not really correct, but good enough to check if model hasn't diverged.
    let ke = 0;
    this.forEachPlate((plate: Plate) => {
      ke += 0.5 * plate.angularSpeed * plate.angularSpeed * plate.mass;
    });
    return ke;
  }

  get relativeMotion() {
    const sum = new THREE.Vector3();
    this.forEachPlate((plate: Plate) => {
      this.forEachPlate((otherPlate: Plate) => {
        if (plate.id < otherPlate.id) {
          const diff = plate.angularVelocity.clone().sub(otherPlate.angularVelocity);
          sum.add(diff);
        }
      });
    });
    return sum.length();
  }

  step(timestep: number) {
    if (this._diverged) {
      return;
    }
    if (config.integration === "euler") {
      eulerStep(this, timestep);
    } else if (config.integration === "rk4") {
      rk4Step(this, timestep);
    } else if (config.integration === "verlet") {
      verletStep(this, timestep);
    }
    this.time += timestep;
    this.stepIdx += 1;
    this.forEachPlate((plate: Plate) => {
      if (plate.angularVelocity.length() > MAX_PLATE_SPEED) {
        plate.angularVelocity.setLength(MAX_PLATE_SPEED);
      }
    });
    // Detect collisions, update geological processes, add new fields and remove unnecessary ones.
    this.simulatePlatesInteractions(timestep, this.stepIdx);
    this.calculateDynamicProperties(true);
    if (this.kineticEnergy > 500) {
      window.alert("Model has diverged, time: " + this.time);
      this._diverged = true;
    }
  }

  // Calculates properties that can be derived from other properties and don't need to be serialized.
  // Those properties also should be updated every step.
  calculateDynamicProperties(optimize: boolean) {
    this.forEachPlate((plate: Plate) => plate.calculateContinentBuffers());
    this.detectCollisions(optimize);
  }

  // Detect collisions, update geological processes, add new fields and remove unnecessary ones.
  simulatePlatesInteractions(timestep: number, stepIdx: number) {
    this.forEachField((field: Field) => field.performGeologicalProcesses(timestep));
    this.forEachPlate((plate: Plate) => plate.removeUnnecessaryFields()); // e.g. fields that subducted
    this.removeEmptyPlates();
    this.generateNewFields(timestep);
    // Some fields might have been added or removed, so update calculated physical properties.
    this.forEachPlate((plate: Plate) => {
      plate.updateInertiaTensor();
    });
    if (stepIdx % CENTER_UPDATE_INTERVAL === 0) {
      this.forEachPlate((plate: Plate) => {
        plate.updateCenter();
      });
    }
    // Update / decrease hot spot torque value.
    this.forEachPlate((plate: Plate) => plate.updateHotSpot(timestep));
    this.tryToMergePlates();
    this.divideBigPlates();
  }

  detectCollisions(optimize: boolean) {
    const fieldsPossiblyColliding = new Set();
    if (optimize) {
      // Optimization can be applied once we know which fields have collided in the previous step.
      // Only those fields and boundaries (plus their neighbors) can collide in this step.
      // There's an obvious assumption that fields won't move more than their own diameter in a single step.
      this.forEachField((field: Field) => {
        if (field.boundary || field.colliding) {
          fieldsPossiblyColliding.add(field);
          field.forEachNeighbor((neigh: Field) => fieldsPossiblyColliding.add(neigh));
        }
        field.resetCollisions();
      });
    } else {
      // No optimization - check all the fields.
      this.forEachField((field: Field) => fieldsPossiblyColliding.add(field));
    }
    fieldsPossiblyColliding.forEach((field: Field) => {
      if (field.colliding) {
        // Collision already handled
        return;
      }
      // Why so strange loop? We want to find the closest colliding fields. First, we need to check plate which can
      // be directly underneath and above. Later, check plates which have bigger density difference.
      // Note that this.plates is sorted by density (ASC).
      if (field.plate.isSubplate) {
        console.warn("Unexpected processing of subplate field");
        return;
      }
      const plateIdx = this.plates.indexOf(field.plate);
      let i = 1;
      while (this.plates[plateIdx + i] || this.plates[plateIdx - i]) {
        const lowerPlate = this.plates[plateIdx + i];
        const lowerField = lowerPlate?.fieldAtAbsolutePos(field.absolutePos);
        if (lowerField) {
          fieldsCollision(lowerField, field);
          // Handle only one collision per field (with the plate laying closest to it).
          return;
        }
        const upperPlate = this.plates[plateIdx - i];
        const upperField = upperPlate?.fieldAtAbsolutePos(field.absolutePos);
        if (upperField) {
          fieldsCollision(field, upperField);
          // Handle only one collision per field (with the plate laying closest to it).
          return;
        }
        i += 1;
      }
    });
  }

  removePlate(id: number) {
    const plate = this.getPlate(id);
    if (!plate) {
      return;
    }
    const idx = this.plates.indexOf(plate);
    this.plates.splice(idx, 1);
  }

  removeEmptyPlates() {
    let i = 0;
    while (i < this.plates.length) {
      if (this.plates[i].size === 0) {
        this.plates.splice(i, 1);
      } else {
        i += 1;
      }
    }
  }

  generateNewFields(timestep: number) {
    const grid = getGrid();
    for (let i = 0, len = this.plates.length; i < len; i++) {
      const plate = this.plates[i];
      plate.adjacentFields.forEach((field: Field) => {
        let collision = false;
        for (let j = 0; j < len; j++) {
          if (i === j) {
            continue;
          }
          const otherPlate = this.plates[j];
          if (otherPlate.fieldAtAbsolutePos(field.absolutePos)) {
            collision = true;
            break;
          }
        }
        if (!collision) {
          field.noCollisionDist += field.displacement(timestep).length();
          // Make sure that adjacent field travelled distance at least similar to size of the single field.
          // It ensures that divergent boundaries will stay in place more or less and new crust will be building
          // only when plate is moving.
          if (field.noCollisionDist > grid.fieldDiameter * 0.9) {
            const neighborsCount = field.neighborsCount();
            // Make sure that new field has at least two existing neighbors. It prevents from creating
            // awkward, narrow shapes of the continents.
            if (neighborsCount > 1) {
              let neighbor = field.neighborAlongVector(field.linearVelocity);
              if (!neighbor) {
                // Sometimes there will be no field along velocity vector (depends of angle between vector and boundary).
                // Use other neighbor instead. Pick one which is closest to the position of the missing field.
                const perfectPos = field.absolutePos.clone().add(field.linearVelocity.clone().setLength(grid.fieldDiameter));
                const minDist = Infinity;
                field.forEachNeighbor((otherField: Field) => {
                  if (otherField.absolutePos.distanceTo(perfectPos) < minDist) {
                    neighbor = otherField;
                  }
                });
              }
              const props: Omit<IFieldOptions, "id" | "plate"> = {};
              if (neighbor?.crustCanBeStretched) {
                props.type = "continent";
                props.crustThickness = neighbor.crustThickness - config.continentalStretchingRatio * grid.fieldDiameter;
                props.age = neighbor.age;
                // When continent is being stretched, move field marker to the new field to emphasise this effect.
                props.marked = neighbor.marked;
                neighbor.marked = false;
              } else {
                props.type = "ocean";
                // `age` is a distance travelled by field. When a new field is added next to the divergent boundary,
                // it's distance from it is around half of its diameter.
                props.age = grid.fieldDiameter * 0.5;
              }
              plate.addFieldAt(props, field.absolutePos);
            }
          }
        } else {
          field.noCollisionDist = 0;
        }
      });
    }
  }

  topFieldAt(position: THREE.Vector3, options?: { visibleOnly?: boolean }) {
    // Plates are sorted by density, start from the top one.
    for (let i = 0, len = this.plates.length; i < len; i++) {
      const plate = this.plates[i];
      if (options?.visibleOnly && !plate.visible) {
        continue;
      }
      const field = plate.fieldAtAbsolutePos(position);
      if (field) {
        return field;
      }
    }
    return null;
  }

  setHotSpot(position: THREE.Vector3, force: THREE.Vector3) {
    const field = this.topFieldAt(position);
    if (field && !field.plate.isSubplate) {
      field.plate.setHotSpot(position, force);
    }
  }

  addRelativeMotion() {
    if (!config.enforceRelativeMotion) {
      return;
    }

    if (this.relativeMotion < MIN_RELATIVE_MOTION) {
      addRelativeMotion(this.plates);
      // Shuffle plates densities to make results more interesting.
      this.plates.forEach((plate: Plate) => {
        plate.density = seedrandom.random();
      });
      this.plates.sort(sortByDensityAsc);
      // Restore integer values.
      this.plates.forEach((plate: Plate, idx: number) => {
        plate.density = idx;
      });
    }
  }

  divideBigPlates() {
    if (this.stepIdx < this.lastPlateDivisionOrMerge + 100) {
      return;
    }

    let newPlateAdded = false;
    this.forEachPlate((plate: Plate) => {
      if (plate.size > config.minSizeRatioForDivision * getGrid().size) {
        const newPlate = dividePlate(plate);
        if (newPlate) {
          this.plates.push(newPlate);
          newPlateAdded = true;
        }
      }
    });
    if (newPlateAdded) {
      this.addRelativeMotion();

      // Make sure that all the densities are unique. Plates are already sorted, so that's the easiest way.
      this.plates.sort(sortByDensityAsc);
      this.plates.forEach((plate: Plate, idx: number) => {
        plate.density = idx;
      });
      this.lastPlateDivisionOrMerge = this.stepIdx;

    }
  }

  tryToMergePlates() {
    if (!config.mergePlates || this.stepIdx < this.lastPlateDivisionOrMerge + 100) {
      return;
    }

    this.forEachPlate(plate1 => {
      this.forEachPlate(plate2 => {
        if (plate1 !== plate2) {
          if (plate1.angularVelocity.clone().sub(plate2.angularVelocity).length() < MIN_RELATIVE_MOTION) {
            this.mergePlates(plate1.id, plate2.id);
            this.lastPlateDivisionOrMerge = this.stepIdx;
          }
        }
      });
    });
  }

  mergePlates(id1: number, id2: number) {
    const plate1 = this.getPlate(id1);
    const plate2 = this.getPlate(id2);

    if (!plate1 || !plate2) {
      return;
    }

    const addField = (field: Field, newId: number, subplate = false) => {
      const newField = new Field({
        id: newId,
        age: field.age,
        originalHue: field.originalHue || plate2.hue,
        marked: field.marked,
        plate: plate1
      });
      newField.crust = field.crust.clone();
      if (field.volcanicAct) {
        newField.volcanicAct = VolcanicActivity.deserialize(field.volcanicAct.serialize(), newField);
      }

      if (!subplate) {
        plate1.addExistingField(newField);
      } else {
        newField.subduction = field.subduction;
        plate1.addToSubplate(newField);
      }
    };

    const grid = getGrid();
    grid.fields.forEach(f => {
      const plate1Field = plate1.fields.get(f.id);
      const absolutePos = plate1.absolutePosition(f.localPos);
      const plate2Field = plate2.fieldAtAbsolutePos(absolutePos);

      if (!plate1Field && plate2Field) {
        addField(plate2Field, f.id);
      }
      if (plate1Field && plate2Field && plate1Field.elevation < plate2Field.elevation) {
        plate1.deleteField(plate1Field.id);
        addField(plate2Field, f.id);
      }
      if (plate1Field && plate2Field && plate1Field.elevation >= plate2Field.elevation) {
        addField(plate2Field, f.id, true);
      }
    });

    this.removePlate(id2);
  }
}
