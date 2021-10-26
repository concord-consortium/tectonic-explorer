import $ from "jquery";
import RockSampleCursorSrc from "../../images/rock-sample-cursor.png";

export const TakeRockSampleCursor = `url("${RockSampleCursorSrc}") 16 42, crosshair`;

export interface IInteractionHandler {
  setActive: () => void;
  setInactive: () => void;
  onPointerDown?: () => boolean;
  onPointerMove?: () => void;
  onPointerUp?: () => void;
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
  return { x: x - parentX, y: y - parentY };
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
