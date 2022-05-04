import * as THREE from "three";
import { ICrossSectionWall } from "../types";

export interface ICrossSectionClickOptions {
  getIntersection: (mesh: THREE.Mesh) => (THREE.Intersection | undefined);
  wallMesh: Record<ICrossSectionWall, THREE.Mesh>;
  cursor: string;
  emitMoveEventWithOverlay?: boolean;
  onPointerDown?: (event: { wall: ICrossSectionWall, intersection: THREE.Vector2 }) => void;
  onPointerMove?: (event: { wall: ICrossSectionWall, intersection: THREE.Vector2 }) => void;
  onPointerOff?: () => void;
}

// Generic helper that detects click on the planet surface and emits an event with provided name.
export default class CrossSectionClick {
  options: ICrossSectionClickOptions;
  emitMoveEventWithOverlay: boolean;
  inProgress: boolean;

  constructor(options: ICrossSectionClickOptions) {
    this.options = options;
    this.emitMoveEventWithOverlay = !!options.emitMoveEventWithOverlay;
  }

  get cursor() {
    return this.options.cursor;
  }

  getRelativeIntersection(wallType: ICrossSectionWall, absoluteIntersection: THREE.Intersection) {
    const wallMesh = this.options.wallMesh[wallType];
    const width = wallMesh.scale.x;
    const height = wallMesh.scale.y;
    const point = absoluteIntersection.point;
    switch(wallType) {
    case "front":
      return new THREE.Vector2(point.x + width * 0.5, -point.y + height * 0.5);
    case "top":
      return new THREE.Vector2(point.x + width * 0.5, -point.z);
    case "left":
      return new THREE.Vector2(point.z + width, -point.y + height * 0.5);
    case "right":
      return new THREE.Vector2(-point.z, -point.y + height * 0.5);
    case "back":
      return new THREE.Vector2(-point.x + width * 0.5, -point.y + height * 0.5);
    }
  }

  getIntersection() {
    const walls = Object.keys(this.options.wallMesh).map((type: ICrossSectionWall) =>
      ({ type, mesh: this.options.wallMesh[type] })
    );
    let intersection: THREE.Vector2 | undefined;

    const hitWall = walls.find(wall => {
      const wallIntersection = this.options.getIntersection(wall.mesh);
      if (wallIntersection) {
        intersection = this.getRelativeIntersection(wall.type, wallIntersection);
        return true;
      }
    });

    return { hitWall, intersection };
  }

  onPointerDown() {
    const { hitWall, intersection } = this.getIntersection();

    if (hitWall && intersection) {
      this.options.onPointerDown?.({ wall: hitWall.type, intersection });
      this.inProgress = true;
      return true;
    }

    return false;
  }

  onPointerMove() {
    const { hitWall, intersection } = this.getIntersection();

    if (hitWall && intersection) {
      this.options.onPointerMove?.({ wall: hitWall.type, intersection });
      this.inProgress = true;
      return true;
    }

    this.options.onPointerOff?.();
    return false;
  }

  onPointerOff() {
    this.options.onPointerOff?.();
  }
}
