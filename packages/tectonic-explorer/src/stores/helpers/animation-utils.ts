import { DEFAULT_CROSS_SECTION_CAMERA_ZOOM, IVec3Array, MAX_CAMERA_ZOOM } from "../../types";
import * as THREE from "three";

interface IAnimateVectorTransitionOptions {
  startPosition: IVec3Array;
  endPosition: IVec3Array;
  maxDuration: number;
  onAnimStep: (currentPosition: IVec3Array) => void;
  onEnd?: () => void;
}

export function animateVectorTransition(options: IAnimateVectorTransitionOptions) {
  const { startPosition, endPosition, maxDuration, onAnimStep, onEnd } = options;

  const startPosVec3 = new THREE.Vector3().fromArray(startPosition);
  const endPosVec3 = new THREE.Vector3().fromArray(endPosition);
  const startTime = window.performance.now();
  const angle = endPosVec3.angleTo(startPosVec3);
  // duration is proportional to angular distance between two vectors.
  const duration = maxDuration * angle / Math.PI;
  const rotationAxis = startPosVec3.clone().cross(endPosVec3).normalize();

  const step = () => {
    const currentTime = window.performance.now();
    const progress = Math.min(1, (currentTime - startTime) / duration);
    if (progress < 1) {
      const currentPos = startPosVec3.clone().applyAxisAngle(rotationAxis, angle * easeInOut(progress));
      onAnimStep(currentPos.toArray());
      window.requestAnimationFrame(step);
    } else {
      // Use endPosition avoid floating-point error.
      onAnimStep(endPosition);
      onEnd?.();
    }
  };
  window.requestAnimationFrame(step);
}

interface IAnimateAngleTransitionOptions {
  startAngle: number; // in degrees
  endAngle: number; // in degrees
  startZoom: number;
  endZoom: number;
  maxDuration: number;
  onAnimStep: (currentAngle: number, currentZoom: number) => void;
  onEnd?: () => void;
}

export function animateAngleAndZoomTransition(options: IAnimateAngleTransitionOptions) {
  const { startAngle, endAngle, startZoom, endZoom, maxDuration, onAnimStep, onEnd } = options;

  const startTime = window.performance.now();
  const angleDiff = endAngle - startAngle;
  const zoomDiff = endZoom - startZoom;
  // duration is proportional to the angle/zoom difference.
  const angleDuration = maxDuration * Math.abs(angleDiff) / 180;
  const maxZoomDiff = MAX_CAMERA_ZOOM - DEFAULT_CROSS_SECTION_CAMERA_ZOOM;
  const zoomDuration = maxDuration * Math.abs(zoomDiff) / maxZoomDiff;
  const duration = Math.max(angleDuration, zoomDuration);

  const step = () => {
    const currentTime = window.performance.now();
    const progress = Math.min(1, (currentTime - startTime) / duration);
    const ease = easeInOut(progress);
    if (progress < 1) {
      onAnimStep(startAngle + angleDiff * ease, startZoom + zoomDiff * ease);
      window.requestAnimationFrame(step);
    } else {
      // Use endPosition avoid floating-point error.
      onAnimStep(endAngle, endZoom);
      onEnd?.();
    }
  };
  window.requestAnimationFrame(step);
}

function easeInOut(t: number) {
  return t * t * (3.0 - 2.0 * t);
}
