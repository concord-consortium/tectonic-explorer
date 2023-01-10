import React from "react";
import { RockKeyLabel } from "../types";
import { IDataSampleInfo, RockSampleColumnName } from "./types";
// Assets
// --- Igneous Rocks ---
import AndesitePatternSrc from "./rock-patterns/andesite-key.png";
import AndesiteCooling from "./rock-diagrams/andesite-diagram-cooling.svg";
import AndesiteIronContent from "./rock-diagrams/andesite-diagram-iron-content.svg";
import BasaltPatternSrc from "./rock-patterns/basalt-key.png";
import BasaltCooling from "./rock-diagrams/basalt-diagram-cooling.svg";
import BasaltIronContent from "./rock-diagrams/basalt-diagram-iron-content.svg";
import GranitePatternSrc from "./rock-patterns/granite-key.png";
import GraniteCooling from "./rock-diagrams/granite-diagram-cooling.svg";
import GraniteIronContent from "./rock-diagrams/granite-diagram-iron-content.svg";
import GabbroPatternSrc from "./rock-patterns/gabbro-key.png";
import GabbroCooling from "./rock-diagrams/gabbro-diagram-cooling.svg";
import GabbroIronContent from "./rock-diagrams/gabbro-diagram-iron-content.svg";
import DioritePatternSrc from "./rock-patterns/diorite-key.png";
import DioriteCooling from "./rock-diagrams/diorite-diagram-cooling.svg";
import DioriteIronContent from "./rock-diagrams/diorite-diagram-iron-content.svg";
import RhyolitePatternSrc from "./rock-patterns/rhyolite-key.png";
import RhyoliteCooling from "./rock-diagrams/rhyolite-diagram-cooling.svg";
import RhyoliteIronContent from "./rock-diagrams/rhyolite-diagram-iron-content.svg";
// --- Mantle Rocks ---
import MantleBrittleDiagram from "./rock-diagrams/mantle-brittle-diagram.svg";
import MantleDuctileDiagram from "./rock-diagrams/mantle-ductile-diagram.svg";

export const MANTLE_BRITTLE = "#5e505d";
export const MANTLE_DUCTILE = "#531a1e";

export const rockColumnLabel: Record<RockSampleColumnName, string> = {
  category: "Category",
  type: "Type",
  temperatureAndPressure: "Temperature & Pressure",
  ironContent: "Iron Content",
  cooling: "Cooling",
  metamorphicGrade: "Metamorphic Grade",
};

export const rockInfo: Partial<Record<RockKeyLabel, IDataSampleInfo>> = {
  // --- Igneous Rocks ---
  "Andesite": {
    category: "Igneous",
    pattern: AndesitePatternSrc,
    ironContent: <AndesiteIronContent />,
    cooling: <AndesiteCooling />,
  },
  "Basalt": {
    category: "Igneous",
    pattern: BasaltPatternSrc,
    ironContent: <BasaltIronContent />,
    cooling: <BasaltCooling />,
  },
  "Gabbro": {
    category: "Igneous",
    pattern: GabbroPatternSrc,
    ironContent: <GabbroIronContent />,
    cooling: <GabbroCooling />,
  },
  "Granite": {
    category: "Igneous",
    pattern: GranitePatternSrc,
    ironContent: <GraniteIronContent />,
    cooling: <GraniteCooling />,
  },
  "Diorite": {
    category: "Igneous",
    pattern: DioritePatternSrc,
    ironContent: <DioriteIronContent />,
    cooling: <DioriteCooling />,
  },
  "Rhyolite": {
    category: "Igneous",
    pattern: RhyolitePatternSrc,
    ironContent: <RhyoliteIronContent />,
    cooling: <RhyoliteCooling />,
  },
  // --- Mantle Rocks ---
  "Mantle (brittle)": {
    category: "Mantle",
    pattern: <div style={{ backgroundColor: MANTLE_BRITTLE, width: "20px", height: "20px" }} />,
    ironContent: <MantleBrittleDiagram />,
  },
  "Mantle (ductile)": {
    category: "Mantle",
    pattern: <div style={{ backgroundColor: MANTLE_DUCTILE, width: "20px", height: "20px" }} />,
    ironContent: <MantleDuctileDiagram />,
  },

  // "Limestone": undefined,
  // "Shale": undefined,
  // "Sandstone": undefined,
  // "Oceanic Sediments": undefined,
  // "Continental Sediments": undefined,

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
