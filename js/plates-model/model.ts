import * as THREE from "three";
import generatePlates from "./generate-plates";
import Plate, { ISerializedPlate, plateHues } from "./plate";
import getGrid from "./grid";
import config from "../config";
import fieldsCollision from "./fields-collision";
import markIslands from "./mark-islands";
import eulerStep from "./physics/euler-integrator";
import rk4Step from "./physics/rk4-integrator";
import verletStep from "./physics/verlet-integrator";
import * as seedrandom from "../seedrandom";
import Field, { FRESH_CRUST_MAX_AGE, IFieldOptions, PREEXISTING_CRUST_AGE } from "./field";
import PlateGroup from "./plate-group";

// Limit max speed of the plate, so model doesn't look crazy.
export const MAX_PLATE_SPEED = 0.04;

// How many steps between plate centers are recalculated.
const CENTER_UPDATE_INTERVAL = 15;

const MIN_RELATIVE_MOTION = 0.005;
const MIN_RELATIVE_MOTION_TO_MERGE_PLATES = 0.001;
// How many steps it takes to assume that relative motion has stopped. In practice, larger value will delay
// stopping the model and displaying a dialog to user.
const MIN_RELATIVE_MOTION_STEPS_COUNT = 100;

function sortByDensityAsc(plateA: Plate, plateB: Plate) {
  return plateA.density - plateB.density;
}

export interface ISerializedModel {
  time: number;
  stepIdx: number;
  lastPlateDivisionOrMerge: number;
  seedrandomState: any;
  plates: ISerializedPlate[];
  nextPlateId: number;
  lowRelativeMotionStepsCount: number;
}

export default class Model {
  stepIdx: number;
  lastPlateDivisionOrMerge: number;
  time: number;
  plates: Plate[];
  nextPlateId = 0;
  _diverged: boolean;
  lowRelativeMotionStepsCount: number;

  constructor(imgData: ImageData | null, initFunction?: ((plates: Record<number, Plate>) => void) | null, seedrandomState?: any) {
    if (config.deterministic && seedrandomState) {
      seedrandom.initializeFromState(seedrandomState);
    } else {
      seedrandom.initialize(config.deterministic);
    }
    this.time = 0;
    this.stepIdx = 0;
    this.lastPlateDivisionOrMerge = 0;
    this.lowRelativeMotionStepsCount = 0;
    this.plates = [];
    if (imgData) {
      // It's very important to keep plates sorted, so if some new plates will be added to this list,
      // it should be sorted again.
      this.plates = generatePlates(imgData, initFunction).sort(sortByDensityAsc);
      this.nextPlateId = Math.max(...this.plates.map(p => p.id)) + 1;
      markIslands(this.plates);
      this.calculateDynamicProperties(false);
    }
  }

  serialize(): ISerializedModel {
    return {
      time: this.time,
      stepIdx: this.stepIdx,
      lastPlateDivisionOrMerge: this.lastPlateDivisionOrMerge,
      seedrandomState: seedrandom.getState(),
      plates: this.plates.map((plate: Plate) => plate.serialize()),
      nextPlateId: this.nextPlateId,
      lowRelativeMotionStepsCount: this.lowRelativeMotionStepsCount
    };
  }

  static deserialize(props: ISerializedModel) {
    const model = new Model(null, null, props.seedrandomState);
    model.time = props.time;
    model.stepIdx = props.stepIdx;
    model.lastPlateDivisionOrMerge = props.lastPlateDivisionOrMerge;
    model.plates = props.plates.map((serializedPlate: ISerializedPlate) => Plate.deserialize(serializedPlate));
    // Process plate groups.
    const platesById: Record<string, Plate> = {};
    model.plates.forEach(plate => platesById[plate.id] = plate);
    const plateGroupProcessed: Record<string, true> = {};
    props.plates.forEach((serializedPlate: ISerializedPlate) => {
      const plateGroupProps = serializedPlate.plateGroup;
      if (plateGroupProps) {
        const key = plateGroupProps.plateIds.toString();
        if (!plateGroupProcessed[key]) {
          const groupPlates = plateGroupProps.plateIds.map(plateId => platesById[plateId]);
          const plateGroup = PlateGroup.deserialize(plateGroupProps, groupPlates);
          plateGroup.plates.forEach(plate => plate.plateGroup = plateGroup);
          plateGroupProcessed[key] = true;
        }
      }
    });
    model.nextPlateId = props.nextPlateId || Math.max(...model.plates.map(p => p.id)) + 1;
    model.lowRelativeMotionStepsCount = props.lowRelativeMotionStepsCount;
    model.calculateDynamicProperties(false);
    return model;
  }

  getNextPlateId() {
    return this.nextPlateId++;
  }

  getNextPlateHue(id: number, hueToAvoid?: number) {
    const getRandomItem = (set: Set<number>) => {
      const items = Array.from(set);
      return items[Math.floor(Math.random() * items.length)];
    };
    const availableHues = new Set<number>(plateHues);

    if (id < plateHues.length) {
      // Use color that matches the plate id.
      return plateHues[id];
    }
    if (this.plates.length < plateHues.length) {
      // Return first color that is not used yet.
      this.plates.forEach(p => {
        availableHues.delete(p.hue);
      });
      return getRandomItem(availableHues);
    }
    // Very unlikely, but if all the available hues are used, return random color.
    if (hueToAvoid !== undefined) {
      availableHues.delete(hueToAvoid);
    }
    return getRandomItem(availableHues);
  }

  getPlate(plateId: number) {
    for (const plate of this.plates) {
      if (plate.id === plateId) {
        return plate;
      }
    }
    return null;
  }

  get plateGroups() {
    const groups = new Set<PlateGroup>();
    for (const plate of this.plates) {
      if (plate.plateGroup && !groups.has(plate.plateGroup)) {
        groups.add(plate.plateGroup);
      }
    }
    return Array.from(groups);
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
    // `return this.getPlatesProp("angularAcceleration")` would work fine too, but... When plate that is part
    // of a group and it calculates its angularAcceleration, it delegates this task to group class. So, for each group,
    // acceleration would be calculated multiple times. If we split calculations to grouped and non-grouped plates,
    // we can sped it up.
    const result = new Map<Plate, any>();
    this.plateGroups.forEach(group => {
      const groupAngularAcceleration = group.angularAcceleration;
      group.plates.forEach(plate => {
        result.set(plate, groupAngularAcceleration.clone());
      });
    });
    this.forEachPlate((plate: Plate) => {
      if (!plate.plateGroup) {
        result.set(plate, plate.angularAcceleration.clone());
      }
    });
    return result;
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
    let sum = 0;
    this.forEachPlate((plate: Plate) => {
      this.forEachPlate((otherPlate: Plate) => {
        if (plate.id < otherPlate.id) {
          if (!plate.mergedWith(otherPlate)) {
            sum += plate.angularVelocity.clone().sub(otherPlate.angularVelocity).length();
          }
        }
      });
    });
    return sum;
  }

  get relativeMotionStopped() {
    return this.lowRelativeMotionStepsCount >= MIN_RELATIVE_MOTION_STEPS_COUNT;
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

    if (this.relativeMotion < MIN_RELATIVE_MOTION) {
      this.lowRelativeMotionStepsCount += 1;
    } else {
      this.lowRelativeMotionStepsCount = 0;
    }

    if (this.kineticEnergy > 500) {
      this._diverged = true;
      throw new Error("model has diverged!");
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
    // Process plates that are part of the group and plates that aren't grouped independently. When group
    // updates its inertia tensor, all the members of the group are also updated. So, split processing not to duplicate
    // math calculations.
    this.plateGroups.forEach(plateGroup => {
      plateGroup.updateInertiaTensor();
    });
    this.forEachPlate(plate => {
      if (!plate.plateGroup) {
        plate.updateInertiaTensor();
      }
    });
    if (stepIdx % CENTER_UPDATE_INTERVAL === 0) {
      this.forEachPlate((plate: Plate) => {
        plate.updateCenter();
      });
    }
    // Update / decrease hot spot torque value.
    this.forEachPlate((plate: Plate) => plate.updateHotSpot(timestep));
    this.tryToGroupPlates();
    this.dividePlatesByAge();
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

  removePlate(plate: Plate) {
    const idx = this.plates.indexOf(plate);
    if (idx !== -1) {
      this.plates.splice(idx, 1);
    }
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
          // Make sure that adjacent field traveled distance at least similar to size of the single field.
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
                // When continent is being stretched, move field marker to the new field to emphasize this effect.
                props.marked = neighbor.marked;
                // `blockFaulting` value doesn't have physical meaning, but it's used to determine its direction in the
                // rendering code. 1e6 value is big enough to cover all the visible fields in the cross-section.
                props.blockFaulting = (neighbor.blockFaulting ?? 1e6) - 1;
                neighbor.marked = false;
              } else {
                props.type = "ocean";
                // `age` is a distance traveled by field. When a new field is added next to the divergent boundary,
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

  // This method tries to divide large oceanic plates. When the fresh crust reaches certain age, the plate might break
  // following this age boundary and start convergence there.
  dividePlatesByAge() {
    // Don't trigger plate division too often. It gives users more time to follow what happens in the model.
    if (this.stepIdx < this.lastPlateDivisionOrMerge + 100) {
      return;
    }
    let newPlateAdded = false;

    this.forEachPlate(plate => {
      if (plate.size / getGrid().size < config.minSizeRatioForDivision) {
        // Plate is too small to be divided. This avoid creating too many plate in the model.
        return;
      }
      // First, check if the old crust takes enough area of the plate. Old crust can be either preexisting crust
      // (colored gray in the age visualization) or the oldest possible fresh crust (colored dark blue).
      let preexistingCrust = 0;
      let maxAgeFreshCrust = 0;
      plate.forEachField(field => {
        if (field.age === PREEXISTING_CRUST_AGE) {
          preexistingCrust += 1;
        } else if (field.age === FRESH_CRUST_MAX_AGE) {
          maxAgeFreshCrust += 1;
        }
      });
      let boundaryAge = 0;
      if (preexistingCrust / plate.size > 0.6) {
        boundaryAge = PREEXISTING_CRUST_AGE;
      } else if (maxAgeFreshCrust / plate.size > 0.6) {
        boundaryAge = FRESH_CRUST_MAX_AGE;
      }
      if (boundaryAge === 0) {
        // Nothing to do, there is not enough of the old crust.
        return;
      }

      // Now, calculate average age of the crust that is younger than the boundary age. This is a small math trick
      // that lets us ensure that newly created plate will have crust age spanning from `0` to `boundaryAge`.
      let belowBoundaryAgeCount = 0;
      let avgAgeBelowBoundaryAge = 0;
      plate.forEachField(field => {
        if (field.age < boundaryAge) {
          belowBoundaryAgeCount += 1;
          avgAgeBelowBoundaryAge += field.age;
        }
      });
      if (belowBoundaryAgeCount > 0) {
        avgAgeBelowBoundaryAge /= belowBoundaryAgeCount;
      }

      if (avgAgeBelowBoundaryAge < boundaryAge * 0.5) {
        // Nothing to do, fresh crust is still to fresh. Edges haven't reached boundary age yet.
        return;
      }

      this.dividePlate(plate, boundaryAge);
      newPlateAdded = true;
    });

    if (newPlateAdded) {
      // Mark division time, so the next one doesn't happen to early.
      this.lastPlateDivisionOrMerge = this.stepIdx;
    }
  }

  dividePlate(plate: Plate, boundaryAge: number) {
    const newPlateId = this.getNextPlateId();
    const newPlateHue = this.getNextPlateHue(newPlateId, plate.hue);
    // Use larger density for the new plate. The model will sort all plates by density and assign unique values later
    const newPlate = new Plate({ id: newPlateId, hue: newPlateHue, density: plate.density + 0.01 });
    newPlate.quaternion.copy(plate.quaternion);
    // Make angular velocity of the new plate the same.
    newPlate.angularVelocity.copy(plate.angularVelocity);
    if (plate.angularSpeed > 0.5 * MAX_PLATE_SPEED) {
      // Reduce velocity of the old plate, as it was moving relatively fast.
      plate.angularVelocity.multiplyScalar(0.5);
    } else if (plate.angularSpeed > 0.2 * MAX_PLATE_SPEED) {
      // Increase speed of the new plate, as the old plate was moving slow.
      newPlate.angularVelocity.multiplyScalar(2);
    } else {
      // Set speed of the new plate, as the old plate was moving very slow.
      newPlate.angularVelocity.setLength(0.75 * MAX_PLATE_SPEED);
    }

    plate.forEachField(field => {
      if (field.age < boundaryAge) {
        plate.deleteField(field.id);
        newPlate.addExistingField(field);
      }
    });

    this.plates.push(newPlate);

    // Make sure that all the densities are unique and use integer values.
    this.plates.sort(sortByDensityAsc);
    this.plates.forEach((p: Plate, idx: number) => {
      p.density = idx;
    });
  }

  tryToGroupPlates() {
    if (!config.groupPlates || this.stepIdx < this.lastPlateDivisionOrMerge + 100) {
      return;
    }

    this.forEachPlate(plate1 => {
      this.forEachPlate(plate2 => {
        if (plate1 !== plate2 && !plate1.mergedWith(plate2)) {
          if (plate1.angularVelocity.clone().sub(plate2.angularVelocity).length() < MIN_RELATIVE_MOTION_TO_MERGE_PLATES) {
            this.groupPlates(plate1, plate2);
            this.lastPlateDivisionOrMerge = this.stepIdx;
          }
        }
      });
    });
  }

  // Plate connection leaves two plates fully separate, but it creates a rigid connection that is reflected in physics
  // calculations. It's an alternative to plate merging.
  groupPlates(plate1: Plate, plate2: Plate) {
    const group1 = plate1.plateGroup || new PlateGroup([plate1]);
    const group2 = plate2.plateGroup || new PlateGroup([plate2]);

    const newPlateGroup = new PlateGroup();
    newPlateGroup.mergeGroup(group1);
    newPlateGroup.mergeGroup(group2);
    newPlateGroup.plates.forEach(plate => {
      plate.plateGroup = newPlateGroup;
    });
  }
}
