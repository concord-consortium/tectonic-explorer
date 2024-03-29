import * as THREE from "three";
import c from "../constants";
import config from "../config";
import { log } from "../log";

const CROSS_SECTION_PADDING = 100;

interface ICrossSectionDrawingProps {
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  emit: (event: string, data?: any) => void;
}

export default class CrossSectionDrawing {
  data: any;
  earthMesh: any;
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  emit: (event: string, data?: any) => void;
  screenWidth: any;

  constructor(options: ICrossSectionDrawingProps) {
    this.getIntersection = options.getIntersection;
    this.emit = options.emit;
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    const geometry = new THREE.SphereGeometry(1.0, 64, 64);
    this.earthMesh = new THREE.Mesh(geometry);
    this.screenWidth = Infinity;
    this.data = null;
  }

  setScreenWidth(width: any) {
    this.screenWidth = width;
  }

  get maxLineWidth() {
    return Math.min(config.maxCrossSectionLength, (this.screenWidth - CROSS_SECTION_PADDING) / config.crossSectionPxPerKm);
  }

  get cursor() {
    return "crosshair";
  }

  checkMaxLength(data: any) {
    const { point1, point2 } = data;
    const length = point1.angleTo(point2) * c.earthRadius;
    if (length > this.maxLineWidth) {
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(point1, point2);
      const allowedRotation = new THREE.Quaternion();
      allowedRotation.slerp(rotation, this.maxLineWidth / length);
      data.point2 = point1.clone().applyQuaternion(allowedRotation);
    }
  }

  onPointerDown() {
    this.data = null;
    const intersection = this.getIntersection(this.earthMesh);
    if (!intersection) {
      return false;
    }
    this.data = {
      point1: intersection.point
    };
    return true;
  }

  onPointerMove() {
    if (!this.data) {
      return;
    }
    const intersection = this.getIntersection(this.earthMesh);
    if (!intersection) {
      return;
    }
    this.data.point2 = intersection.point;
    this.checkMaxLength(this.data);
    this.emit("crossSectionDrawing", this.data);
  }

  onPointerUp() {
    if (this.data?.point2) {
      this.emit("crossSectionDrawingEnd", this.data);
      log({ action: "CrossSectionDrawingFinished" });
    }
    this.data = null;
  }
}
