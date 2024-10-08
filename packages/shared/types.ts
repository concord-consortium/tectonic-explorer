import { IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface ITectonicExplorerInteractiveState extends IRuntimeInteractiveMetadata {
  version: 1;
  dataSamples: IDataSample[];
  dataSampleColumns: DataSampleColumnName[];
  planetViewSnapshot?: string;
  crossSectionSnapshot?: string;
}

export interface IVector2 {
  x: number;
  y: number;
}

export type TempPressureValue = null | "Low" | "Med" | "High";

export type ICrossSectionWall = "front" | "back" | "top" | "left" | "right";

export type RockKeyLabel = "Granite" | "Basalt" | "Gabbro" | "Rhyolite" | "Andesite" | "Diorite" | "Limestone" |
  "Shale" | "Sandstone" | "Oceanic Sediments" | "Continental Sediments" | "Mantle (brittle)" | "Mantle (ductile)" |
  "Low Grade Metamorphic Rock (Subduction Zone)" | "Medium Grade Metamorphic Rock (Subduction Zone)" | "High Grade Metamorphic Rock (Subduction Zone)" |
  "Low Grade Metamorphic Rock (Continental Collision)" | "Medium Grade Metamorphic Rock (Continental Collision)" | "High Grade Metamorphic Rock (Continental Collision)" |
  "Contact Metamorphism" | "Iron-poor Magma" | "Intermediate Magma" | "Iron-rich Magma" | "Sky" | "Ocean";

export type RockKeyLabelArray = RockKeyLabel[];

export interface IDataSample {
  id: number;
  crossSectionWall: ICrossSectionWall;
  coords: IVector2;
  type: RockKeyLabel;
  temperature: TempPressureValue;
  pressure: TempPressureValue;
  notes?: string;
  selected?: boolean;
}

export type DataSampleColumnName = "id" | "category" | "type" | "temperatureAndPressure" | "ironContent" | "cooling" | "metamorphicGrade" | "particlesSize" | "magmaTemperature" | "notes";

export type DataSampleCategory = "Igneous" | "Mantle" | "Metamorphic" | "Sedimentary" | "Sediments" | "Magma" | "Other";

export interface IDataSampleInfo {
  category: DataSampleCategory;
  pattern: JSX.Element;
  ironContent?: JSX.Element; // Igneous Rocks, Mantle Rocks, Magma
  cooling?: JSX.Element; // Igneous Rocks
  metamorphicGrade?: JSX.Element; // Metamorphic Rocks
  metamorphicGradeTableDiagram?: JSX.Element // Smaller version of metamorphic grade diagram
  particlesSize?: JSX.Element; // Sedimentary Rocks
  tableParticleSize?: JSX.Element;
  magmaTemperature?: JSX.Element; // Magma
}
