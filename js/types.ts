import FieldStore from "./stores/field-store";

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IEventCoords {
  x: number;
  y: number;
}

export type IVec3Array = [number, number, number] | number[];

export type IQuaternionArray = [number, number, number, number] | number[];

export type IMatrix3Array = [number, number, number, number, number, number, number, number, number] | number[];

export type RockKeyLabel = "Granite" | "Basalt" | "Gabbro" | "Rhyolite" | "Andesite" | "Diorite" | "Limestone" |
  "Shale" | "Sandstone" | "Oceanic Sediments" | "Continental Sediments" | "Mantle (brittle)" | "Mantle (ductile)" |
  "Low Grade Metamorphic Rock (Subduction Zone)" | "Medium Grade Metamorphic Rock (Subduction Zone)" | "High Grade Metamorphic Rock (Subduction Zone)" |
  "Low Grade Metamorphic Rock (Continental Collision)" | "Medium Grade Metamorphic Rock (Continental Collision)" | "High Grade Metamorphic Rock (Continental Collision)" |
  "Contact Metamorphism" | "Iron-poor Magma" | "Intermediate Magma" | "Iron-rich Magma" | "Sky" | "Ocean";

export type ICrossSectionWall = "front" | "back" | "top" | "left" | "right";

// longitudinal boundary => east/west forces; latitudinal boundary => north/south forces
export type BoundaryOrientation = "longitudinal" | "northern-latitudinal" | "southern-latitudinal";
export type BoundaryType = "convergent" | "divergent";
export interface IBoundaryInfo {
  // Fields are ordered from north to south, or from west to east.
  fields: [FieldStore, FieldStore];
  orientation: BoundaryOrientation;
  type: BoundaryType | undefined;
  canvasClickPos?: IEventCoords; // position of boundary click in canvas
}

export interface IHotSpot {
  position: THREE.Vector3;
  force: THREE.Vector3;
}

export type TabName = "map-type" | "seismic-data" | "options";

export const MIN_CAMERA_ZOOM = 0.8;
export const MAX_CAMERA_ZOOM = 4.0;
export const CAMERA_ZOOM_STEP = 0.1;
