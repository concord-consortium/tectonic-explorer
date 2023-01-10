export type RockSampleColumnName = "category" | "type" | "temperatureAndPressure" | "ironContent" | "cooling" | "metamorphicGrade";

export type RockCategory = "Igneous";

export interface IDataSampleInfo {
  category: RockCategory;
  pattern: string;
  ironContent?: JSX.Element; // Igneous Rocks, Mantle Rocks, Magma
  cooling?: JSX.Element; // Igneous Rocks
  metamorphicGrade?: JSX.Element; // Metamorphic Rocks
  particleSize?: JSX.Element; // Sedimentary Rocks
  magmaTemperature?: JSX.Element; // Magma
}
