import * as THREE from "three";
import Sphere from "../peels/sphere";
import PeelsField from "../peels/field";
import config from "../config";
import VoronoiSphere from "./voronoi-sphere";
import { toCartesian } from "../geo-utils";
import { kdTree } from "kd-tree-javascript";
import c from "../constants";
import { IVector3 } from "../types";

export interface IKDTreeNode extends IVector3 { 
  id: number;
}

export interface IGridField extends PeelsField {
  adjacentFields: number[];
  localPos: THREE.Vector3;
}

function dist(a: IKDTreeNode, b: IKDTreeNode) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

class Grid {
  fieldDiameter: number;
  fieldDiameterInKm: number;
  kdTree: kdTree<IKDTreeNode>;
  sphere: Sphere;
  voronoiSphere: VoronoiSphere;

  constructor() {
    this.sphere = new Sphere({ divisions: config.divisions });
    this.processFields();
    this.fieldDiameter = this.calcFieldDiameter();
    this.fieldDiameterInKm = this.fieldDiameter * c.earthRadius;
    // Note that kdTree will modify and reorder input array.
    this.kdTree = new kdTree<IKDTreeNode>(this.generateKDTreeNodes(), dist, ["x", "y", "z"]);
    this.voronoiSphere = new VoronoiSphere(config.voronoiSphereFieldsCount, this.kdTree);
  }

  get size(): number {
    return this.fields.length;
  }

  get fields(): IGridField[] {
    // New properties added in .processFields()
    return this.sphere.fields as IGridField[];
  }

  get verticesCount() {
    // 6 vertices for each poly (-12 vertices for the 12 pentagons)
    return this.fields.length * 6 - 12;
  }

  // Pre-calculate additional information.
  processFields() {
    this.fields.forEach((field: IGridField) => {
      field.localPos = toCartesian(field.position);
      field.adjacentFields = field._adjacentFields.map((f: PeelsField) => f.id);
    });
  }

  calcFieldDiameter() {
    const field = this.fields[3];
    let distSum = 0;
    field.adjacentFields.forEach((id: number) => {
      const adjField = this.fields[id];
      distSum += field.localPos.distanceTo(adjField.localPos);
    });
    return distSum / field.adjacentFields.length;
  }

  generateKDTreeNodes() {
    const fields: IKDTreeNode[] = [];
    this.fields.forEach(field => {
      const pos = field.localPos;
      fields.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        id: field.id // index
      });
    });
    return fields;
  }

  neighborsCount(fieldId: number) {
    return this.fields[fieldId].adjacentFields.length;
  }

  nearestFields(point: IVector3, count = 1) {
    // .id is missing in point type, but that's fine. It's not part of the distance calculations.
    return this.kdTree.nearest(point as IKDTreeNode, count);
  }

  // point is expected to have .x, .y, .z properties.
  nearestFieldId(point: IVector3) {
    if (config.optimizedCollisions) {
      // O(1), less accurate:
      return this.voronoiSphere.getNearestId(point);
    }
    // O(logn), accurate:
    // .id is missing in point type, but that's fine. It's not part of the distance calculations.
    return this.kdTree.nearest(point as IKDTreeNode, 1)[0][0].id;
  }

  getGeometryAttributes() {
    const transparent = { r: 0, g: 0, b: 0, a: 0 };
    // Another option: "poly-per-field"
    return this.sphere.toCG({ colorFn: () => transparent, type: "vertex-per-field" });
  }
}

let instance: Grid;

export default function getGrid() {
  if (!instance) {
    instance = new Grid();
  }
  return instance;
}


// Useful for debugging purposes and playing with the model in the browser console.
(self as any).getGrid = getGrid;
