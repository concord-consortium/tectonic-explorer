import * as THREE from "three";
import { IEventCoords } from "../types";

interface IPlanetClickOptions {
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  emit: (event: string, data?: any) => void;
  startEventName?: string;
  moveEventName?: string;
  endEventName?: string;
  cursor?: string;
  alwaysEmitMoveEvent?: boolean;
}

export interface IPlanetClickData {
  canvasPosition: IEventCoords;
  globePosition: THREE.Vector3 | null; // null when there's no intersection with the globe
}

// Generic helper that detects click on the planet surface and emits an event with provided name.
export default class PlanetClick {
  earthMesh: any;
  getIntersection: (mesh: THREE.Mesh) => THREE.Intersection;
  emit: (event: string, data?: IPlanetClickData) => void;
  startEventName?: string;
  moveEventName?: string;
  endEventName?: string;
  cursor: string;
  pointerDown: boolean;
  alwaysEmitMoveEvent: boolean;

  constructor(options: IPlanetClickOptions) {
    const { getIntersection, emit, startEventName, moveEventName, endEventName, alwaysEmitMoveEvent } = options;
    this.getIntersection = getIntersection;
    this.emit = emit;
    this.startEventName = startEventName;
    this.moveEventName = moveEventName;
    this.endEventName = endEventName;
    this.cursor = options.cursor || "crosshair";
    this.alwaysEmitMoveEvent = !!alwaysEmitMoveEvent;
    // Test geometry is a sphere with radius 1, which is exactly what is used in the whole model for earth visualization.
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64));
  }

  onPointerDown(canvasPosition: IEventCoords) {
    if (!this.startEventName) {
      return false;
    }
    const intersection = this.getIntersection(this.earthMesh);
    if (!intersection) {
      return false;
    }
    this.emit(this.startEventName, { canvasPosition, globePosition: intersection.point });
    this.pointerDown = true;
    return true;
  }

  onPointerMove(canvasPosition: IEventCoords) {
    if ((!this.alwaysEmitMoveEvent && !this.pointerDown) || !this.moveEventName) {
      return;
    }
    const intersection = this.getIntersection(this.earthMesh);
    if (!intersection) {
      if (this.alwaysEmitMoveEvent) {
        this.emit(this.moveEventName, { canvasPosition, globePosition: null });
      }
      return;
    }
    this.emit(this.moveEventName, { canvasPosition, globePosition: intersection.point });
  }

  onPointerUp() {
    if (this.pointerDown && this.endEventName) {
      this.emit(this.endEventName);
    }
    this.pointerDown = false;
  }
}
