import config from "../config";
import Model from "./model";
import { rockProps } from "./rock-properties";
import c from "../constants";

export function getField(model: Model, plateId: number, fieldId: number) {
  return model.getPlate(plateId)?.fields.get(fieldId);
}

export function getFieldElevation(model: Model, plateId: number, fieldId: number) {
  return getField(model, plateId, fieldId)?.elevation;
}

export function isFieldSubducting(model: Model, plateId: number, fieldId: number) {
  return getField(model, plateId, fieldId)?.subduction?.progress || 0 > 0;
}

// Returns sorted array of rock layers. Rock ID is mapped to label. Example:
// [ { rock: "Granite", thickness: 0.5 } ]
// All the rock labels can be seen in rock-properties.ts file.
export function getFieldRockLayers(model: Model, plateId: number, fieldId: number) {
  return getField(model, plateId, fieldId)?.crust.rockLayers.map(rl => ({
    rock: rockProps(rl.rock).label,
    thickness: rl.thickness
  }));
}

export function runModelFor(model: Model, timeInMillionYears: number) {
  const startTime = model.time * c.modelTimeToMillionYearsRatio;
  const endTime = startTime + timeInMillionYears;
  while (model.time * c.modelTimeToMillionYearsRatio < endTime) {
    model.step(config.timestep);
  }
}
