import React from "react";
import { RockKeyLabel, IDataSampleInfo, DataSampleColumnName } from "./types";
// SVG and PNG assets
// --- Igneous Rocks ---
import AndesitePatternSrc from "./rock-patterns/andesite-key.png";
import AndesiteCoolingDiagram from "./rock-diagrams/andesite-diagram-cooling.svg";
import AndesiteIronContentDiagram from "./rock-diagrams/andesite-diagram-iron-content.svg";
import BasaltPatternSrc from "./rock-patterns/basalt-key.png";
import BasaltCoolingDiagram from "./rock-diagrams/basalt-diagram-cooling.svg";
import BasaltIronContentDiagram from "./rock-diagrams/basalt-diagram-iron-content.svg";
import GranitePatternSrc from "./rock-patterns/granite-key.png";
import GraniteCoolingDiagram from "./rock-diagrams/granite-diagram-cooling.svg";
import GraniteIronContentDiagram from "./rock-diagrams/granite-diagram-iron-content.svg";
import GabbroPatternSrc from "./rock-patterns/gabbro-key.png";
import GabbroCoolingDiagram from "./rock-diagrams/gabbro-diagram-cooling.svg";
import GabbroIronContentDiagram from "./rock-diagrams/gabbro-diagram-iron-content.svg";
import DioritePatternSrc from "./rock-patterns/diorite-key.png";
import DioriteCoolingDiagram from "./rock-diagrams/diorite-diagram-cooling.svg";
import DioriteIronContentDiagram from "./rock-diagrams/diorite-diagram-iron-content.svg";
import RhyolitePatternSrc from "./rock-patterns/rhyolite-key.png";
import RhyoliteCoolingDiagram from "./rock-diagrams/rhyolite-diagram-cooling.svg";
import RhyoliteIronContentDiagram from "./rock-diagrams/rhyolite-diagram-iron-content.svg";
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
import MetamorphicLowGradeSubductionZoneDiagram from "./rock-diagrams/metamorphic-rock-low-grade-subduction-zone-diagram-small.svg";
import MetamorphicHighGradeCCCollisionDiagramSmall from "./rock-diagrams/metamorphic-rock-high-grade-cc-collision-diagram-small.svg";
import MetamorphicHighGradeContactDiagramSmall from "./rock-diagrams/metamorphic-rock-high-grade-contact-metamorphism-diagram-small.svg";
import MetamorphicHighGradeSubductionZoneDiagramSmall from "./rock-diagrams/metamorphic-rock-high-grade-subduction-zone-diagram-small.svg";
import MetamorphicMediumGradeCCCollisionDiagramSmall from "./rock-diagrams/metamorphic-rock-medium-grade-cc-collision-diagram-small.svg";
import MetamorphicMediumGradeSubductionZoneDiagramSmall from "./rock-diagrams/metamorphic-rock-medium-grade-subduction-zone-diagram-small.svg";
import MetamorphicLowGradeCCCollisionDiagramSmall from "./rock-diagrams/metamorphic-rock-low-grade-cc-collision-diagram-small.svg";
import MetamorphicLowGradeSubductionZoneDiagramSmall from "./rock-diagrams/metamorphic-rock-low-grade-subduction-zone-diagram-small.svg";
// --- Sedimentary Rocks ---
import LimestonePatternSrc from "./rock-patterns/limestone-key.png";
import LimestoneDiagram from "./rock-diagrams/limestone-diagram.svg";
import SandstonePatternSrc from "./rock-patterns/sandstone-key.png";
import SandstoneDiagram from "./rock-diagrams/sandstone-diagram.svg";
import ShalePatternSrc from "./rock-patterns/shale-key.png";
import ShaleDiagram from "./rock-diagrams/shale-diagram.svg";
// --- Sediments ---
import OceanicSedimentPatternSrc from "./rock-patterns/oceanic-sediment-key.png";
import ContinentalSedimentPatternSrc from "./rock-patterns/continental-sediment-key.png";
// --- Magma ---
import IntermediateMagmaIronContentDiagram from "./rock-diagrams/intermediate-magma-diagram-iron-content.svg";
import IntermediateMagmaTemperatureDiagram from "./rock-diagrams/intermediate-magma-diagram-temperature.svg";
import IronPoorMagmaIronContentDiagram from "./rock-diagrams/iron-poor-magma-diagram-iron-content.svg";
import IronPoorMagmaTemperatureDiagram from "./rock-diagrams/iron-poor-magma-diagram-temperature.svg";
import IronRichMagmaIronContentDiagram from "./rock-diagrams/iron-rich-magma-diagram-iron-content.svg";
import IronRichMagmaTemperatureDiagram from "./rock-diagrams/iron-rich-magma-diagram-temperature.svg";

export const MANTLE_BRITTLE_COLOR = "#5e505d";
export const MANTLE_DUCTILE_COLOR = "#531a1e";

export const SKY_COLOR_1 = "#4275be";
export const SKY_COLOR_2 = "#bcd6e8";
export const SKY_GRADIENT = `linear-gradient(to bottom, ${SKY_COLOR_1}, ${SKY_COLOR_2})`;
export const OCEAN_COLOR = "#1da2d8";

export const MAGMA_IRON_RICH = "#b90310";
export const MAGMA_INTERMEDIATE = "#fb0d1e";
export const MAGMA_IRON_POOR = "#fd6f79";

export const MAGMA_BLOB_BORDER_METAMORPHIC = "rgb(27, 117, 23, 1)";

export const dataSampleColumnLabel: Record<DataSampleColumnName, string> = {
  id: "Pin",
  category: "Category",
  type: "Type",
  temperatureAndPressure: "Temperature & Pressure",
  ironContent: "Iron Content",
  cooling: "Cooling",
  metamorphicGrade: "Metamorphic Grade",
  particlesSize: "Size of Particles",
  magmaTemperature: "Magma Temperature",
  notes: "Notes"
};

export const dataSampleColumnOrder: Record<DataSampleColumnName, number> = {
  id: 0,
  category: 1,
  type: 2,
  temperatureAndPressure: 3,
  ironContent: 4,
  cooling: 5,
  metamorphicGrade: 6,
  particlesSize: 7,
  magmaTemperature: 8,
  notes: 9
};

export const getSortedColumns = (columns: DataSampleColumnName[]) =>
  columns.slice().sort((a, b) => dataSampleColumnOrder[a] - dataSampleColumnOrder[b]);

export const dataSampleInfo: Record<RockKeyLabel, IDataSampleInfo> = {
  // --- Igneous Rocks ---
  "Andesite": {
    category: "Igneous",
    pattern: <img src={AndesitePatternSrc} />,
    ironContent: <AndesiteIronContentDiagram />,
    cooling: <AndesiteCoolingDiagram />,
  },
  "Basalt": {
    category: "Igneous",
    pattern: <img src={BasaltPatternSrc} />,
    ironContent: <BasaltIronContentDiagram />,
    cooling: <BasaltCoolingDiagram />,
  },
  "Gabbro": {
    category: "Igneous",
    pattern: <img src={GabbroPatternSrc} />,
    ironContent: <GabbroIronContentDiagram />,
    cooling: <GabbroCoolingDiagram />,
  },
  "Granite": {
    category: "Igneous",
    pattern: <img src={GranitePatternSrc} />,
    ironContent: <GraniteIronContentDiagram />,
    cooling: <GraniteCoolingDiagram />,
  },
  "Diorite": {
    category: "Igneous",
    pattern: <img src={DioritePatternSrc} />,
    ironContent: <DioriteIronContentDiagram />,
    cooling: <DioriteCoolingDiagram />,
  },
  "Rhyolite": {
    category: "Igneous",
    pattern: <img src={RhyolitePatternSrc} />,
    ironContent: <RhyoliteIronContentDiagram />,
    cooling: <RhyoliteCoolingDiagram />,
  },
  // --- Mantle Rocks ---
  "Mantle (brittle)": {
    category: "Mantle",
    pattern: <div style={{ background: MANTLE_BRITTLE_COLOR, width: "20px", height: "20px" }} />,
    ironContent: <MantleBrittleDiagram />,
  },
  "Mantle (ductile)": {
    category: "Mantle",
    pattern: <div style={{ background: MANTLE_DUCTILE_COLOR, width: "20px", height: "20px" }} />,
    ironContent: <MantleDuctileDiagram />,
  },
  // --- Metamorphic Rocks ---
  "Low Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicLowGradePatternSrc} />,
    metamorphicGrade: <MetamorphicLowGradeSubductionZoneDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicLowGradeSubductionZoneDiagramSmall/>,
  },
  "Medium Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicMediumGradePatternSrc} />,
    metamorphicGrade: <MetamorphicMediumGradeSubductionZoneDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicMediumGradeSubductionZoneDiagramSmall/>,
  },
  "High Grade Metamorphic Rock (Subduction Zone)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicHighGradePatternSrc} />,
    metamorphicGrade: <MetamorphicHighGradeSubductionZoneDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicHighGradeSubductionZoneDiagramSmall/>,
  },
  "Low Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicLowGradePatternSrc} />,
    metamorphicGrade: <MetamorphicLowGradeCCCollisionDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicLowGradeCCCollisionDiagramSmall/>,
  },
  "Medium Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicMediumGradePatternSrc} />,
    metamorphicGrade: <MetamorphicMediumGradeCCCollisionDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicMediumGradeCCCollisionDiagramSmall/>,
  },
  "High Grade Metamorphic Rock (Continental Collision)": {
    category: "Metamorphic",
    pattern: <img src={MetamorphicHighGradePatternSrc} />,
    metamorphicGrade: <MetamorphicHighGradeCCCollisionDiagram/>,
    metamorphicGradeTableDiagram: <MetamorphicHighGradeCCCollisionDiagramSmall/>,

  },
  "Contact Metamorphism": {
    category: "Metamorphic",
    pattern: <div style={{ background: MAGMA_BLOB_BORDER_METAMORPHIC, width: "20px", height: "20px" }} />,
    metamorphicGrade: <MetamorphicHighGradeContactDiagram/>,
  },
  // --- Sedimentary Rocks ---
  "Limestone": {
    category: "Sedimentary",
    pattern: <img src={LimestonePatternSrc} />,
    particlesSize: <LimestoneDiagram />,
  },
  "Shale": {
    category: "Sedimentary",
    pattern: <img src={ShalePatternSrc} />,
    particlesSize: <ShaleDiagram />,
  },
  "Sandstone": {
    category: "Sedimentary",
    pattern: <img src={SandstonePatternSrc} />,
    particlesSize: <SandstoneDiagram />,
  },
  // --- Sediments ---
  "Oceanic Sediments": {
    category: "Sediments",
    pattern: <img src={OceanicSedimentPatternSrc} />,
  },
  "Continental Sediments": {
    category: "Sediments",
    pattern: <img src={ContinentalSedimentPatternSrc} />,
  },
  // --- Magma ---
  "Iron-poor Magma": {
    category: "Magma",
    pattern: <div style={{ background: MAGMA_IRON_POOR, width: "20px", height: "20px" }} />,
    ironContent: <IronPoorMagmaIronContentDiagram />,
    magmaTemperature: <IronPoorMagmaTemperatureDiagram />,
  },
  "Intermediate Magma": {
    category: "Magma",
    pattern: <div style={{ background: MAGMA_INTERMEDIATE, width: "20px", height: "20px" }} />,
    ironContent: <IntermediateMagmaIronContentDiagram />,
    magmaTemperature: <IntermediateMagmaTemperatureDiagram />,
  },
  "Iron-rich Magma": {
    category: "Magma",
    pattern: <div style={{ background: MAGMA_IRON_RICH, width: "20px", height: "20px" }} />,
    ironContent: <IronRichMagmaIronContentDiagram />,
    magmaTemperature: <IronRichMagmaTemperatureDiagram />,
  },
  // --- Other ---
  "Sky": {
    category: "Other",
    pattern: <div style={{ background: SKY_GRADIENT, width: "20px", height: "20px" }} />,
  },
  "Ocean": {
    category: "Other",
    pattern: <div style={{ background: OCEAN_COLOR, width: "20px", height: "20px" }} />,
  },
};
