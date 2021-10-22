export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export type IVec3Array = [number, number, number] | number[];

export type IQuaternionArray = [number, number, number, number] | number[];

export type IMatrix3Array = [number, number, number, number, number, number, number, number, number] | number[];

export type RockKeyLabel = "Granite" | "Basalt" | "Gabbro" | "Rhyolite" | "Andesite" | "Diorite" | "Limestone" |
  "Shale" | "Sandstone" | "Oceanic Sediments" | "Continental" | "Mantle (brittle)" | "Mantle (ductile)" | "Low Grade" |
  "Medium Grade" | "High Grade" | "Silica-rich" | "Intermediate" | "Iron-rich" | "Sky" | "Ocean";
