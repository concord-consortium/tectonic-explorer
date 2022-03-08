import { BASE_CONTINENT_ELEVATION } from "../../plates-model/crust";
import FieldStore from "../field-store";
import ModelStore from "../model-store";
import { findFieldFromNeighboringPlate, getBoundaryInfo } from "./boundary-utils";

function isContinent(field: FieldStore) {
  // FieldStore is just a shallow copy of real Field class, so there's no access to rock layers there.
  // However, elevation is a good way here to check if field is a continent or not.
  return field.elevation >= BASE_CONTINENT_ELEVATION * 0.9;
}

function isContinentDensityValid(startField: FieldStore, model: ModelStore, fieldProcessed: Record<number, boolean>) {
  let result = true;
  let bordersWithContinent = false;

  const queue: FieldStore[] = [startField];
  fieldProcessed[startField.id] = true;

  while (queue.length > 0) {
    const f = queue.shift() as FieldStore;
    if (f.boundary) {
      const neighboringField = findFieldFromNeighboringPlate(f, model);
      if (neighboringField && isContinent(neighboringField)) {
        // This is continent-continent collision or divergence. In either case continent is defined correctly,
        // and there's no need to check densities.
        bordersWithContinent = true;
      }
      if (neighboringField && !isContinent(neighboringField) && neighboringField?.plate.density < f.plate.density) {
        const boundaryInfo = getBoundaryInfo(f, neighboringField, model);
        if (boundaryInfo?.type === "convergent") {
          // Continent shares a boundary with ocean that has lower density. This is usually incorrect.
          // The only case that can save this scenario is another continent on the other side of the boundary
          // (handled above).
          result = false;
        }
      }
    }

    f.forEachNeighbor(n => {
      if (!fieldProcessed[n.id] && isContinent(n)) {
        fieldProcessed[n.id] = true;
        queue.push(n);
      }
    });
  }

  return bordersWithContinent || result;
}

// We have been struggling with how to handle the issue when students set the density of the plates to be opposite what
// would actually happen with the continent set-up, specifically when it comes to convergence / subduction.
// This function tries to detect this case. See: https://www.pivotaltracker.com/story/show/181257654
export function isDensityDefinedCorrectly(model: ModelStore) {
  let result = true;

  model.plates.forEach(plate => {
    if (!result) {
      return;
    }
    const fieldProcessed: Record<number, boolean> = {};
    plate.forEachField(field => {
      if (!result) {
        return;
      }
      if (!fieldProcessed[field.id] && isContinent(field) && !isContinentDensityValid(field, model, fieldProcessed)) {
        result = false;
      }
    });
  });
  return result;
}
