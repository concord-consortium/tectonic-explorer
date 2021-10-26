import * as THREE from "three";
import { ICrossSectionWall } from "../types";

interface ICrossSectionClickOptions {
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  frontWall: THREE.Mesh;
  backWall: THREE.Mesh;
  rightWall: THREE.Mesh;
  leftWall: THREE.Mesh;
  topWall: THREE.Mesh;
  cursor?: string;
  onPointerDown: (event: { wall: ICrossSectionWall, intersection: THREE.Vector2 }) => void;
}

// Generic helper that detects click on the planet surface and emits an event with provided name.
export default class CrossSectionClick {
  options: ICrossSectionClickOptions;
  inProgress: boolean;

  constructor(options: ICrossSectionClickOptions) {
    this.options = options;
  }

  // "active" state is when user points at target object but still hasn't pressed the mouse button.
  // This kind of state should provide some hint that interaction is possible.
  setActive() {
    if (this.options.cursor) {
      document.body.style.cursor = this.options.cursor;
    }

  }

  setInactive() {
    if (this.options.cursor) {
      document.body.style.cursor = "auto";
    }
  }

  onPointerDown() {
    let intersection = this.options.getIntersection(this.options.frontWall);
    if (intersection) {
      const wallWidth = this.options.frontWall.scale.x;
      const wallHeight = this.options.frontWall.scale.y;
      // Rescale intersection coordinates from global 3D coordinates to coordinates relative to the wall top-left corner
      // (coords system usually used in 2D Canvas context).
      const intersectionPointRelative = new THREE.Vector2(intersection.point.x + wallWidth * 0.5, -intersection.point.y + wallHeight * 0.5);

      this.options.onPointerDown({ wall: "front", intersection: intersectionPointRelative });
      this.inProgress = true;
      return true;
    }

    intersection = this.options.getIntersection(this.options.topWall);
    if (intersection) {
      const wallWidth = this.options.topWall.scale.x;
      const wallHeight = this.options.topWall.scale.y;
      // Rescale intersection coordinates from global 3D coordinates to coordinates relative to the wall top-left corner
      // (coords system usually used in 2D Canvas context).
      const intersectionPointRelative = new THREE.Vector2(intersection.point.x + wallWidth * 0.5, -intersection.point.y + wallHeight * 0.5);

      this.options.onPointerDown({ wall: "top", intersection: intersectionPointRelative });
      this.inProgress = true;
      return true;
    }

    intersection = this.options.getIntersection(this.options.leftWall);
    if (intersection) {
      const wallWidth = this.options.leftWall.scale.x;
      const wallHeight = this.options.leftWall.scale.y;
      // Rescale intersection coordinates from global 3D coordinates to coordinates relative to the wall top-left corner
      // (coords system usually used in 2D Canvas context).
      const intersectionPointRelative = new THREE.Vector2(intersection.point.z + wallWidth, -intersection.point.y + wallHeight * 0.5);

      this.options.onPointerDown({ wall: "left", intersection: intersectionPointRelative });
      this.inProgress = true;
      return true;
    }

    intersection = this.options.getIntersection(this.options.rightWall);
    if (intersection) {
      const wallHeight = this.options.rightWall.scale.y;
      // Rescale intersection coordinates from global 3D coordinates to coordinates relative to the wall top-left corner
      // (coords system usually used in 2D Canvas context).
      const intersectionPointRelative = new THREE.Vector2(-intersection.point.z, -intersection.point.y + wallHeight * 0.5);

      this.options.onPointerDown({ wall: "right", intersection: intersectionPointRelative });
      this.inProgress = true;
      return true;
    }

    intersection = this.options.getIntersection(this.options.backWall);
    if (intersection) {
      const wallWidth = this.options.backWall.scale.x;
      const wallHeight = this.options.backWall.scale.y;
      // Rescale intersection coordinates from global 3D coordinates to coordinates relative to the wall top-left corner
      // (coords system usually used in 2D Canvas context).
      const intersectionPointRelative = new THREE.Vector2(-intersection.point.x + wallWidth * 0.5, -intersection.point.y + wallHeight * 0.5);

      this.options.onPointerDown({ wall: "back", intersection: intersectionPointRelative });
      this.inProgress = true;
      return true;
    }

    return false;
  }
}
