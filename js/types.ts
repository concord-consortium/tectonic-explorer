export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export type IVec3Array = [number, number, number] | number[];

export type IQuaternionArray = [number, number, number, number] | number[];

export type IMatrix3Array = [number, number, number, number, number, number, number, number, number] | number[];

export type RockKeyLabel = "Granite" | "Basalt" | "Gabbro" | "Rhyolite" | "Andesite" | "Diorite" | "Limestone" |
  "Shale" | "Sandstone" | "Oceanic Sediments" | "Continental Sediments" | "Mantle (brittle)" | "Mantle (ductile)" |
  "Low Grade Metamorphic Rock" | "Medium Grade Metamorphic Rock" | "High Grade Metamorphic Rock" | "Silica-rich Magma" |
  "Intermediate Magma" | "Iron-rich Magma" | "Sky" | "Ocean";

export type ICrossSectionWall = "front" | "back" | "top" | "left" | "right";

// horizontal boundary => north/south forces; vertical boundary => east/west forces
export type BoundaryOrientation = "horizontal-lower" | "horizontal-upper" | "vertical";
export type BoundaryType = "convergent" | "divergent";
export interface IBoundaryInfo {
  orientation?: BoundaryOrientation;  // undefined => no boundary
  type?: BoundaryType;
  plates?: [string, string | null];   // stringified plate ids
}
