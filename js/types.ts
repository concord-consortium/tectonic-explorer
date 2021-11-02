import FieldStore from "./stores/field-store";

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

// longitudinal boundary => east/west forces; latitudinal boundary => north/south forces
export type BoundaryOrientation = "longitudinal" | "northern-latitudinal" | "southern-latitudinal";
export type BoundaryType = "convergent" | "divergent";
export interface IBoundaryInfo {
  // Fields are ordered from north to south, or from west to east.
  fields: [FieldStore, FieldStore];
  orientation: BoundaryOrientation;
  type: BoundaryType | undefined;
}

export interface IHotSpot {
 position: THREE.Vector3;
 force: THREE.Vector3;
}
