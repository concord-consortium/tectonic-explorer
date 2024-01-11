import $ from "jquery";
import * as THREE from "three";
import RockSampleCursorSrc from "../assets/rock-sample-cursor.png";
import TempPressureCursorPng from "../assets/temp-pressure-cursor.png";
import CollectDataCursorPng from "../assets/collect-data-cursor.png";
import CollectDataCursorDisabledPng from "../assets/collect-data-cursor-disabled.png";

import { IVector2 } from "../types";

export const TakeRockSampleCursor = `url("${RockSampleCursorSrc}") 16 42, crosshair`;
export const CollectDataCursor = `url("${CollectDataCursorPng}") 36 35, crosshair`;
export const CollectDataCursorDisabled = `url("${CollectDataCursorDisabledPng}") 36 35, crosshair`;
export const TempPressureCursor = `url("${TempPressureCursorPng}") 8 8, crosshair`;

export interface IInteractionHandler {
  cursor: string;
  emitMoveEventWithOverlay?: boolean;
  onPointerDown?: (pos: IVector2) => boolean;
  onPointerMove?: (pos: IVector2) => void;
  onPointerOff?: () => void;
  onPointerUp?: (pos: IVector2) => void;
  setScreenWidth?: (width: number) => void;
}

// Mouse position in pixels.
export function mousePos(event: any, targetElement: any) {
  const $targetElement = $(targetElement);
  const parentX = $targetElement.offset()?.left || 0;
  const parentY = $targetElement.offset()?.top || 0;
  let x = event.pageX;
  let y = event.pageY;
  if (event.touches && event.touches.length > 0) {
    x = event.touches[0].pageX;
    y = event.touches[0].pageY;
  }
  return new THREE.Vector2(x - parentX, y - parentY);
}

// Normalized mouse position [-1, 1].
export function mousePosNormalized(event: any, targetElement: any) {
  const pos = mousePos(event, targetElement);
  const $targetElement = $(targetElement);
  const parentWidth = $targetElement.width() || 0;
  const parentHeight = $targetElement.height() || 0;
  pos.x = (pos.x / parentWidth) * 2 - 1;
  pos.y = -(pos.y / parentHeight) * 2 + 1;
  return pos;
}
