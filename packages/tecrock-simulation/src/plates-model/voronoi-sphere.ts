import { kdTree } from "kd-tree-javascript";
import { toCartesian, toSpherical } from "../geo-utils";
import { IVector3 } from "../types";
import { IKDTreeNode } from "./grid";

// Data structure mapping coordinates on a sphere to the nearest point in a kdTree.
// Retrievals from the map are of O(1) complexity. The result resembles a voronoi diagram, hence the name.
export default class VoronoiSphere {
  latMin: number;
  latNum: number;
  latRange: number;
  lonMin: number;
  lonNum: number;
  lonRange: number;
  raster: Uint16Array;
  
  constructor(pointsNum: number, kdTreeInstance: kdTree<IKDTreeNode>) {
    const size = Math.sqrt(pointsNum);
    this.lonRange = 2 * Math.PI;
    this.lonMin = -Math.PI;
    this.lonNum = Math.round(2 * size);
    this.latRange = Math.PI;
    this.latMin = -Math.PI / 2;
    this.latNum = Math.round(size);
    const raster = new Uint16Array(this.latNum * this.lonNum);
    for (let i = 0, li = this.latNum; i < li; i++) {
      for (let j = 0, lj = this.lonNum; j < lj; j++) {
        const lat = i * this.latRange / li + this.latMin;
        const lon = j * this.lonRange / lj + this.lonMin;
        const vertex = toCartesian([lat, lon]);
        // `vertex as any`, as vertex is missing .id property of IKDTreeNode. ID is not necessary for lookup.
        // It's a problem of kdTree typings.
        const nearestId = kdTreeInstance.nearest(vertex as any, 1)[0][0].id;
        const rasterId = i * this.lonNum + j;
        raster[rasterId] = nearestId;
      }
    }
    this.raster = raster;
  }

  getNearestId(vector: IVector3) {
    const spherical = toSpherical(vector);
    let i = (spherical.lat - this.latMin) * this.latNum / this.latRange;
    i = Math.max(Math.min(i, this.latNum - 1), 0);
    i = Math.round(i);
    let j = (spherical.lon - this.lonMin) * this.lonNum / this.lonRange;
    j = Math.max(Math.min(j, this.lonNum - 1), 0);
    j = Math.round(j);
    return this.raster[i * this.lonNum + j];
  }
}
