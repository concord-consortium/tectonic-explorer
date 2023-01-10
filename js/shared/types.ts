export interface IEventCoords {
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

export interface IDataSample {
  id: string;
  crossSectionWall: ICrossSectionWall;
  coords: IEventCoords;
  rockLabel: RockKeyLabel;
  temperature: TempPressureValue;
  pressure: TempPressureValue;
  notes?: string;
  selected?: boolean;
}

export type RockSampleColumnName = "category" | "type" | "temperatureAndPressure" | "ironContent" | "cooling" | "metamorphicGrade" | "particlesSize" | "magmaTemperature" | "notes";

export type RockCategory = "Igneous" | "Mantle" | "Metamorphic" | "Sedimentary" | "Sediments" | "Magma" | "Other";

export interface IDataSampleInfo {
  category: RockCategory;
  pattern: JSX.Element;
  ironContent?: JSX.Element; // Igneous Rocks, Mantle Rocks, Magma
  cooling?: JSX.Element; // Igneous Rocks
  metamorphicGrade?: JSX.Element; // Metamorphic Rocks
  particlesSize?: JSX.Element; // Sedimentary Rocks
  magmaTemperature?: JSX.Element; // Magma
}
