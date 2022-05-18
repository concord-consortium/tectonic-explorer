import Plate from "./plate";
import { random } from "../seedrandom";
import Field from "./field";

const MIN_SIZE = 100; // fields

function getRandomValue(collection: Map<any, any>) {
  const values = Array.from(collection.values());
  return values[Math.floor(random() * values.length)];
}

function getBoundaryField(plate: Plate) {
  const adjField = getRandomValue(plate.adjacentFields);
  if (adjField) {
    // Some neighbors of plate adjacent field is a boundary field. Pick any.
    for (const neighborId of adjField.adjacentFields) {
      if (plate.fields.has(neighborId)) {
        return plate.fields.get(neighborId);
      }
    }
  } else {
    // Plate has no adjacent fields, which means it covers the whole planet and there are no boundaries. Pick any field.
    return getRandomValue(plate.fields);
  }
}

export default function dividePlate(plate: Plate, newPlateId: number) {
  if (plate.size < MIN_SIZE) {
    return null;
  }
  const startField = getBoundaryField(plate);
  const visited: Record<string, boolean> = { [startField.id]: true };
  const queue = [startField];
  const halfPlateSize = plate.size * 0.5;

  // Use the same density, as the model will sort all plates by density and assign unique values later.
  const newPlate = new Plate({ id: newPlateId, density: plate.density, hue: plate.hue });
  newPlate.quaternion.copy(plate.quaternion);
  // Make angular velocity of the new plate opposite.
  newPlate.angularVelocity.copy(plate.angularVelocity).multiplyScalar(-1);

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
