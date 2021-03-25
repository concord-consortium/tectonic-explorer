import Plate from "./plate";
import { random } from "../seedrandom";
import * as THREE from "three";
import Field from "./field";

const MIN_SIZE = 100; // fields

function randomVec3() {
  return (new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1)).normalize();
}

function getBoundaryField(plate: Plate) {
  const adjField = plate.adjacentFields.values().next().value;
  if (adjField) {
    // Some neighbors of plate adjacent field is a boundary field. Pick any.
    for (const neighborId of adjField.adjacentFields) {
      if (plate.fields.has(neighborId)) {
        return plate.fields.get(neighborId);
      }
    }
  } else {
    // Plate has no adjacent fields, which means it covers the whole planet and there are no boundaries. Pick any field.
    return plate.fields.values().next().value;
  }
}

export default function dividePlate(plate: Plate) {
  if (plate.size < MIN_SIZE) {
    return null;
  }
  const startField = getBoundaryField(plate);
  const visited: Record<string, boolean> = { [startField.id]: true };
  const queue = [startField];
  const halfPlateSize = plate.size * 0.5;

  // Use the same density, as the model will sort all plates by density and assign unique values later.
  const newPlate = new Plate({ density: plate.density, hue: Math.round(random() * 360) });
  newPlate.quaternion.copy(plate.quaternion);
  // Angular velocity should be pretty similar, but not identical.
  newPlate.angularVelocity.copy(plate.angularVelocity).setLength(plate.angularSpeed * 0.8);
  newPlate.angularVelocity.applyAxisAngle(randomVec3(), 0.5);

  while (queue.length > 0 && newPlate.size < halfPlateSize) {
    const field = queue.shift();
    field.forEachNeighbor((adjField: Field) => {
      if (!visited[adjField.id]) {
        queue.push(adjField);
        visited[adjField.id] = true;
      }
    });
    plate.deleteField(field.id);
    newPlate.addExistingField(field);
  }

  return newPlate;
}
