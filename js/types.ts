import FieldStore from "./stores/field-store";
import { IVector2 } from "./shared";
export * from "./shared/types";

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export type IVec3Array = [number, number, number] | number[];

export type IQuaternionArray = [number, number, number, number] | number[];

export type IMatrix3Array = [number, number, number, number, number, number, number, number, number] | number[];

// longitudinal boundary => east/west forces; latitudinal boundary => north/south forces
export type BoundaryOrientation = "longitudinal" | "northern-latitudinal" | "southern-latitudinal";
export type BoundaryType = "convergent" | "divergent";
export interface IBoundaryInfo {
  // Fields are ordered from north to south, or from west to east.
  fields: [FieldStore, FieldStore];
  orientation: BoundaryOrientation;
  type: BoundaryType | undefined;
  canvasClickPos?: IVector2; // position of boundary click in canvas
}

export interface IHotSpot {
  position: THREE.Vector3;
  force: THREE.Vector3;
}

export type TabName = "map-type" | "seismic-data" | "options";

export const DEFAULT_CROSS_SECTION_CAMERA_ANGLE = 3;
export const DEFAULT_CROSS_SECTION_CAMERA_ZOOM = 1;
export const MIN_CAMERA_ZOOM = 0.8;
export const MAX_CAMERA_ZOOM = 4.0;
export const CAMERA_ZOOM_STEP = 0.1;

