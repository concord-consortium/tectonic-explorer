export enum Rock {
  OceanicSediment = 0,
  Granite = 1,
  Basalt = 2,
  Gabbro = 3,
  Rhyolite = 4,
  Andesite = 5,
  Diorite = 6,
  Limestone = 8,
  Shale = 9,
  Sandstone = 10
}


export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export type IVec3Array = [number, number, number] | number[];

export type IQuaternionArray = [number, number, number, number] | number[];

export type IMatrix3Array = [number, number, number, number, number, number, number, number, number] | number[];
