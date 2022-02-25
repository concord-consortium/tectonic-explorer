import * as THREE from "three";
import { LENGTH_RATIO } from "../plates-view/force-arrow";
import config from "../config";

// THREE.PlaneGeometry default orientation.
const DEFAULT_PLANE_ORIENTATION = new THREE.Vector3(0, 0, 1);
const MAX_FORCE_LEN = config.userForce;

function limitForceLength(data: any) {
  if (data.force.length() > MAX_FORCE_LEN) {
    data.force.setLength(MAX_FORCE_LEN);
  }
}

interface IForceDrawingOptions {
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  emit: (event: string, data?: any) => void;
}

export default class ForceDrawing {
  data: any;
  earthMesh: any;
  emit: (event: string, data: any) => void;
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  planeMesh: any;

  constructor(options: IForceDrawingOptions) {
    this.getIntersection = options.getIntersection;
    this.emit = options.emit;
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64));
    // Test geometry for a second point. This plane will be set, so perpendicular to Earth surface and vector
    // going from Earth center to the first point.
    this.planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100));
    this.data = null;
  }

  get cursor() {
    return "crosshair";
  }

  onPointerDown() {
    const intersection = this.getIntersection(this.earthMesh);
    if (!intersection) {
      return false;
    }
    // Rotate and move plane, so it's perpendicular to vector going from the center of the Earth to the
    // base of the force arrow.
    this.planeMesh.quaternion.setFromUnitVectors(DEFAULT_PLANE_ORIENTATION, intersection.point);
    this.planeMesh.position.copy(intersection.point);
    // Update matrices. Usually it's done automatically by THREE.js when object is being rendered,
    // but this mesh is never being rendered. It's used only to calculate intersection.
    this.planeMesh.updateMatrix();
    this.planeMesh.updateMatrixWorld();
    this.data = {
      position: intersection.point,
      force: new THREE.Vector3(0, 0, 0)
    };
    return true;
  }

  onPointerMove() {
    if (!this.data) {
      return;
    }
    const intersection = this.getIntersection(this.planeMesh);
    if (!intersection) {
      return;
    }
    this.data.force = intersection.point.clone().sub(this.data.position).multiplyScalar(1 / LENGTH_RATIO);
    limitForceLength(this.data);
    this.emit("forceDrawing", this.data);
  }

  onPointerUp() {
    if (this.data) {
      this.emit("forceDrawingEnd", this.data);
    }
    this.data = null;
  }
}
