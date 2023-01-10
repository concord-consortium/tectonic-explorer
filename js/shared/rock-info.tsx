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
// -- Metamorphic Rocks ---
import MetamorphicLowGradePatternSrc from "./rock-patterns/metamorphic-low-grade-key.png";
import MetamorphicMediumGradePatternSrc from "./rock-patterns/metamorphic-medium-grade-key.png";
import MetamorphicHighGradePatternSrc from "./rock-patterns/metamorphic-high-grade-key.png";
import MetamorphicHighGradeCCCollisionDiagram from "./rock-diagrams/metamorphic-rock-high-grade-cc-collision-diagram.svg";
import MetamorphicHighGradeContactDiagram from "./rock-diagrams/metamorphic-rock-high-grade-contact-metamorphism-diagram.svg";
import MetamorphicHighGradeSubductionZoneDiagram from "./rock-diagrams/metamorphic-rock-high-grade-subduction-zone-diagram.svg";
import MetamorphicMediumGradeCCCollisionDiagram from "./rock-diagrams/metamorphic-rock-medium-grade-cc-collision-diagram.svg";
import MetamorphicMediumGradeSubductionZoneDiagram from "./rock-diagrams/metamorphic-rock-medium-grade-subduction-zone-diagram.svg";
import MetamorphicLowGradeCCCollisionDiagram from "./rock-diagrams/metamorphic-rock-low-grade-cc-collision-diagram.svg";
import MetamorphicLowGradeSubductionZoneDiagram from "./rock-diagrams/metamorphic-rock-low-grade-subduction-zone-diagram.svg";
// --- Sedimentary Rocks ---
import LimestonePatternSrc from "./rock-patterns/limestone-key.png";
import LimestoneDiagram from "./rock-diagrams/limestone-diagram.svg";
import SandstonePatternSrc from "./rock-patterns/sandstone-key.png";
import SandstoneDiagram from "./rock-diagrams/sandstone-diagram.svg";
import ShalePatternSrc from "./rock-patterns/shale-key.png";
import ShaleDiagram from "./rock-diagrams/shale-diagram.svg";

export const MANTLE_BRITTLE = "#5e505d";
export const MANTLE_DUCTILE = "#531a1e";

export const rockColumnLabel: Record<RockSampleColumnName, string> = {
  category: "Category",
  type: "Type",
  temperatureAndPressure: "Temperature & Pressure",
  ironContent: "Iron Content",
  cooling: "Cooling",
  metamorphicGrade: "Metamorphic Grade",
  particlesSize: "Size of Particles"
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
  // --- Metamorphic Rocks ---
  "Low Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: MetamorphicLowGradePatternSrc,
    metamorphicGrade: <MetamorphicLowGradeSubductionZoneDiagram />,
  },
  "Medium Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: MetamorphicMediumGradePatternSrc,
    metamorphicGrade: <MetamorphicMediumGradeSubductionZoneDiagram />,
  },
  "High Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: MetamorphicHighGradePatternSrc,
    metamorphicGrade: <MetamorphicHighGradeSubductionZoneDiagram />,
  },
  "Low Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: MetamorphicLowGradePatternSrc,
    metamorphicGrade: <MetamorphicLowGradeCCCollisionDiagram />,
  },
  "Medium Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: MetamorphicMediumGradePatternSrc,
    metamorphicGrade: <MetamorphicMediumGradeCCCollisionDiagram />,
  },
  "High Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: MetamorphicHighGradePatternSrc,
    metamorphicGrade: <MetamorphicHighGradeCCCollisionDiagram />,
  },
  "Contact Metamorphism": {
    category: "Metamorphic",
    pattern: MetamorphicHighGradePatternSrc,
    metamorphicGrade: <MetamorphicHighGradeContactDiagram />,
  },
  // --- Sedimentary Rocks ---
  "Limestone": {
    category: "Sedimentary",
    pattern: LimestonePatternSrc,
    particlesSize: <LimestoneDiagram />,
  },
  "Shale": {
    category: "Sedimentary",
    pattern: ShalePatternSrc,
    particlesSize: <ShaleDiagram />,
  },
  "Sandstone": {
    category: "Sedimentary",
    pattern: SandstonePatternSrc,
    particlesSize: <SandstoneDiagram />,
  },
  // --- Sediments ---
  // "Oceanic Sediments": undefined,
  // "Continental Sediments": undefined,
  // --- Magma ---
  // "Iron-poor Magma": undefined,
  // "Intermediate Magma": undefined,
  // "Iron-rich Magma": undefined,
  // --- Other ---
  // "Sky": undefined,
  // "Ocean": undefined
};
