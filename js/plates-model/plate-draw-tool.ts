import { random } from "../seedrandom";
import Field, { elevationToCrustThickness, FieldType, SEA_LEVEL } from "./field";
import Plate from "./plate";

const MAX_CONTINENTAL_CRUST_RATIO = 0.5;
const MAX_DIST = 7;
const SHELF_ELEVATION = 0.96 * SEA_LEVEL;
const SHELF_SLOPE = 0.2;

function smoothAreaAroundShelves(shelfFields: Field[]) {
  const queue = shelfFields;
  const visited: Record<number, boolean> = {};
  const distance: Record<number, number> = {};
  const maxDistance = Math.ceil(SHELF_ELEVATION / SHELF_SLOPE);

  // Mark initial fields as visited
  queue.forEach((field: Field) => {
    visited[field.id] = true;
    distance[field.id] = 0;
  });

  while (queue.length > 0) {
    const field = queue.shift() as Field;
    const newDist = distance[field.id] + 1;
    if (newDist < maxDistance) {
      field.forEachNeighbour((neigh: Field) => {
        if (!visited[neigh.id]) {
          visited[neigh.id] = true;
          distance[neigh.id] = newDist;
          const finalElevation = Math.max(SHELF_ELEVATION - newDist * SHELF_SLOPE, neigh.elevation);
          neigh.type = "continent";
          neigh.setDefaultProps();
          neigh.setCrustThickness(elevationToCrustThickness(finalElevation));
          queue.push(neigh);
        }
      });
    }
  }
}

export default function plateDrawTool(plate: Plate, fieldId: number, type: FieldType) {
  const plateSize = plate.size;
  let continentSize = 0;
  if (type === "continent") {
    plate.fields.forEach((field: Field) => {
      if (field.continentalCrust) {
        continentSize += 1;
      }
    });
    if ((continentSize + 1) / plateSize > MAX_CONTINENTAL_CRUST_RATIO) {
      return;
    }
  }

  const shelf = new Set<Field>();
  const queue: Field[] = [];
  const visited: Record<number, boolean> = {};
  const distance: Record<number, number> = {};
  const startingField = plate.fields.get(fieldId);
  if (!startingField) {
    return;
  }
  queue.push(startingField);
  distance[fieldId] = 0;
  visited[fieldId] = true;

  while (queue.length > 0) {
    const field = queue.shift() as Field;
    if (type === "continent" && field.isOcean) {
      continentSize += 1;
    }
    field.type = type;
    field.setDefaultProps();
    if (type === "continent") {
      field.setCrustThickness(field.crustThickness + 0.1 * random());
    }
    // Make shape of continent a bit random, but keep eraser shape consistent.
    const newDistance = type === "continent" ? distance[field.id] + 1 + 3 * random() : distance[field.id] + 2;
    const continentAreaWithinLimit = type === "ocean" || (continentSize + 1) / plateSize <= MAX_CONTINENTAL_CRUST_RATIO;
    if (newDistance <= MAX_DIST && continentAreaWithinLimit) {
      field.forEachNeighbour((otherField: Field) => {
        if (!visited[otherField.id]) {
          visited[otherField.id] = true;
          distance[otherField.id] = newDistance;
          queue.push(otherField);
        }
        if (visited[otherField.id] && newDistance < distance[otherField.id]) {
          distance[otherField.id] = newDistance;
        }
      });
    } else if (type === "continent" && field.anyNeighbour((otherField: Field) => otherField.elevation < SHELF_ELEVATION * 0.95)) {
      // Continent drawing mode. The edge of the continent should have a bit lower elevation, so the transition
      // between ocean and continent is smooth.
      field.setCrustThickness(elevationToCrustThickness(SHELF_ELEVATION));
      shelf.add(field);
    } else if (type === "ocean") {
      // Continent erasing mode. The same idea - making sure that the transition between ocean and continent is smooth.
      field.forEachNeighbour((otherField: Field) => {
        if (otherField.isContinent) {
          const finalElevation = Math.min(SHELF_ELEVATION, otherField.elevation);
          otherField.setCrustThickness(elevationToCrustThickness(finalElevation));
        }
      });
    }
  }

  smoothAreaAroundShelves(Array.from(shelf.values()));
}
