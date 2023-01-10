import React from "react";
import { RockKeyLabel } from "../types";
import GranitePatternSrc from "./rock-patterns/granite-key.png";
import GraniteCooling from "./rock-diagrams/granite-cooling.svg";
import GraniteIronContent from "./rock-diagrams/granite-iron-content.svg";
import { IDataSampleInfo, RockSampleColumnName } from "./types";

export const rockColumnLabel: Record<RockSampleColumnName, string> = {
  category: "Category",
  type: "Type",
  temperatureAndPressure: "Temperature & Pressure",
  ironContent: "Iron Content",
  cooling: "Cooling",
  metamorphicGrade: "Metamorphic Grade",
};

export const rockInfo: Partial<Record<RockKeyLabel, IDataSampleInfo>> = {
  "Granite": {
    category: "Igneous",
    pattern: GranitePatternSrc,
    ironContent: <GraniteIronContent />,
    cooling: <GraniteCooling />,
  },
  // "Basalt": undefined,
  // "Gabbro": undefined,
  // "Rhyolite": undefined,
  // "Andesite": undefined,
  // "Diorite": undefined,
  // "Limestone": undefined,
  // "Shale": undefined,
  // "Sandstone": undefined,
  // "Oceanic Sediments": undefined,
  // "Continental Sediments": undefined,
  // "Mantle (brittle)": undefined,
  // "Mantle (ductile)": undefined,
  // "Low Grade Metamorphic Rock (Subduction Zone)": undefined,
  // "Medium Grade Metamorphic Rock (Subduction Zone)": undefined,
  // "High Grade Metamorphic Rock (Subduction Zone)": undefined,
  // "Low Grade Metamorphic Rock (Continental Collision)": undefined,
  // "Medium Grade Metamorphic Rock (Continental Collision)": undefined,
  // "High Grade Metamorphic Rock (Continental Collision)": undefined,
  // "Contact Metamorphism": undefined,
  // "Iron-poor Magma": undefined,
  // "Intermediate Magma": undefined,
  // "Iron-rich Magma": undefined,
  // "Sky": undefined,
  // "Ocean": undefined
};
