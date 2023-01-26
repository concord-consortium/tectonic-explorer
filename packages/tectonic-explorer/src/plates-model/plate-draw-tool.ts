import Field, { FieldType } from "./field";
import { BASE_CONTINENTAL_CRUST_THICKNESS, BASE_OCEANIC_CRUST_THICKNESS } from "./crust";
import Plate from "./plate";
import config from "../config";

const MAX_CONTINENTAL_CRUST_RATIO = 0.5;
const TOOL_RADIUS = 0.23;
const MAIN_TOOL_RATIO = (TOOL_RADIUS - config.shelfWidth) / TOOL_RADIUS;
const CONTINENT_OCEAN_DIFF = BASE_CONTINENTAL_CRUST_THICKNESS - BASE_OCEANIC_CRUST_THICKNESS;

function getContinentSize(plate: Plate) {
  let continentSize = 0;
  plate.fields.forEach((field: Field) => {
    if (field.continentalCrust) {
      continentSize += 1;
    }
  });
  return continentSize;
}

function setupField(field: Field, fieldTypeBeingDrawn: FieldType, distanceRatio: number) {
  if (distanceRatio < MAIN_TOOL_RATIO) {
    field.setDefaultProps(fieldTypeBeingDrawn);
  } else {
    const shelfRatio = (1 - distanceRatio) / (1 - MAIN_TOOL_RATIO);
    const shelfElevation = fieldTypeBeingDrawn === "continent" ? shelfRatio * CONTINENT_OCEAN_DIFF : (1 - shelfRatio) * CONTINENT_OCEAN_DIFF;
    const shelfCrustThickness = BASE_OCEANIC_CRUST_THICKNESS + shelfElevation;

    const shouldAddShelfWhileDrawingContinent = fieldTypeBeingDrawn === "continent" && shelfCrustThickness > field.crustThickness;
    const shouldAddShelfWhileErasingContinent = fieldTypeBeingDrawn === "ocean" && field.continentalCrust && shelfCrustThickness < field.crustThickness;

    if (shouldAddShelfWhileDrawingContinent || shouldAddShelfWhileErasingContinent) {
      field.setDefaultProps("continent", shelfCrustThickness);
    }
  }
}

export default function plateDrawTool(plate: Plate, fieldId: number, fieldTypeBeingDrawn: FieldType) {
  const plateSize = plate.size;
  // First, check if continent won't get too big.
  if (fieldTypeBeingDrawn === "continent" && (getContinentSize(plate) + 1) / plateSize > MAX_CONTINENTAL_CRUST_RATIO) {
    // Do nothing if continent takes too much area of the plate.
    return;
  }

  // Continents are drawn or erased using BFS.
  const queue: Field[] = [];
  const visited: Record<number, boolean> = {};
  const startingField = plate.fields.get(fieldId);

  if (!startingField) {
    return;
  }
  queue.push(startingField);
  visited[fieldId] = true;

  while (queue.length > 0) {
    const field = queue.shift() as Field;
    const distanceRatio = field.localPos.distanceTo(startingField.localPos) / TOOL_RADIUS;
    setupField(field, fieldTypeBeingDrawn, distanceRatio);

    field.forEachNeighbor((otherField: Field) => {
      if (!visited[otherField.id] && otherField.localPos.distanceTo(startingField.localPos) <= TOOL_RADIUS) {
        visited[otherField.id] = true;
        queue.push(otherField);
      }
    });
  }
}
