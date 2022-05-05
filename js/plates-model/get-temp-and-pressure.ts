import * as THREE from "three";
import { IIntersectionData, invScaleY } from "../plates-view/render-cross-section";
import ModelStore from "../stores/model-store";
import { RockKeyLabel } from "../types";

export type TempPressureValue = null | "Low" | "Med" | "High";

const tempPressureValueOrder = {
  Low: 1,
  Med: 2,
  High: 3,
};

// See: https://docs.google.com/presentation/d/1akzkA5gWRHQ-ZjPFrrlOjZvNfYoPorTh0r149yNp7so/edit#slide=id.g119772d9b67_0_15
const rockBasedPressure: Partial<Record<RockKeyLabel, TempPressureValue>> = {
  "Low Grade Metamorphic Rock (Continental Collision)": "Low",
  "Medium Grade Metamorphic Rock (Continental Collision)": "Med",
  "High Grade Metamorphic Rock (Continental Collision)": "High",
  "Low Grade Metamorphic Rock (Subduction Zone)": "Med",
  "Medium Grade Metamorphic Rock (Subduction Zone)": "Med",
  "High Grade Metamorphic Rock (Subduction Zone)": "High"
};

export const getPressure = (model: ModelStore, intersectionData: IIntersectionData, intersectionCoords: THREE.Vector2): TempPressureValue => {
  const { field } = intersectionData;
  if (!field) return null;
  const rockBasedResult: TempPressureValue = rockBasedPressure[intersectionData.label] || null;
  let depthBasedResult: TempPressureValue = null;

  // Note that field returned from cross-section might not be the top one if it's subducting. In this case,
  // use the model to retrieve the top field and use its elevation to calculate total depth.
  let topElevation = field.elevation;
  if (field.subduction) {
    // If field is subducting, we need to find the top field to start calculating pressure from its surface.
    const plate = model.getPlate(field.plateId as number);
    if (plate) {
      const absolutePos = plate.fields.get(field.id)?.absolutePos;
      if (absolutePos) {
        const topField = model.topFieldAt(absolutePos);
        if (topField) {
          topElevation = topField.elevation;
        }
      }
    }
  }

  const depthInModelUnits = topElevation - invScaleY(intersectionCoords.y);
  if (depthInModelUnits < 1.1) {
    depthBasedResult = "Low";
  } else if (depthInModelUnits < 2.1) {
    depthBasedResult = "Med";
  } else {
    depthBasedResult = "High";
  }

  if (!rockBasedResult) {
    return depthBasedResult;
  }
  // If depth-based result is higher than the result calculated using rock type (like metamorphic rocks),
  // use the depth-based result.
  // See: https://docs.google.com/presentation/d/1akzkA5gWRHQ-ZjPFrrlOjZvNfYoPorTh0r149yNp7so/edit#slide=id.g119772d9b67_0_15
  return tempPressureValueOrder[depthBasedResult] > tempPressureValueOrder[rockBasedResult] ? depthBasedResult : rockBasedResult;
};

// See:
// 1. https://docs.google.com/presentation/d/1akzkA5gWRHQ-ZjPFrrlOjZvNfYoPorTh0r149yNp7so/edit#slide=id.g11ddd57747d_0_121
// 2. https://docs.google.com/presentation/d/1akzkA5gWRHQ-ZjPFrrlOjZvNfYoPorTh0r149yNp7so/edit#slide=id.g119772d9b67_0_30
const rockBasedTemperature: Partial<Record<RockKeyLabel, TempPressureValue>> = {
  "Low Grade Metamorphic Rock (Continental Collision)": "Low",
  "Medium Grade Metamorphic Rock (Continental Collision)": "Med",
  "High Grade Metamorphic Rock (Continental Collision)": "High",
  "Low Grade Metamorphic Rock (Subduction Zone)": "Low",
  "Medium Grade Metamorphic Rock (Subduction Zone)": "Low",
  "High Grade Metamorphic Rock (Subduction Zone)": "Med",
  "Iron-rich Magma": "High",
  "Intermediate Magma": "High",
  "Iron-poor Magma": "High",
  "Mantle (ductile)": "High",
  "Contact Metamorphism": "High"
};

export const getTemperature = (model: ModelStore, intersectionData: IIntersectionData, intersectionCoords: THREE.Vector2): TempPressureValue => {
  const { field } = intersectionData;
  if (!field) return null;

  const rockBasedResult: TempPressureValue = rockBasedTemperature[intersectionData.label] || null;

  const age = field.normalizedAge ?? 1;
  const crustAgeBasedResult: TempPressureValue = age < 0.25 ? "High" : (age < 0.7 ? "Med" : null);

  // In case of temperature, rock-based or crust age-based result is always used when available.
  // It's just more precise than depth-based result.
  if (rockBasedResult || crustAgeBasedResult) {
    return rockBasedResult || crustAgeBasedResult;
  }

  // There's no need to handle subduction in case of temperature. Temp gradient starts from the subducting field top.
  const depthInModelUnits = field.elevation - invScaleY(intersectionCoords.y);
  if (depthInModelUnits < 0.5) {
    return "Low";
  } else if (depthInModelUnits < 1) {
    return "Med";
  } else {
    return "High";
  }
};
