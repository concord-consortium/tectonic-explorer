import { IVec3Array } from "../../types";
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
  maxDuration: number;
  onAnimStep: (currentAngle: number) => void;
  onEnd?: () => void;
}

export function animateAngleTransition(options: IAnimateAngleTransitionOptions) {
  const { startAngle, endAngle, maxDuration, onAnimStep, onEnd } = options;

  const startTime = window.performance.now();
  const angleDiff = endAngle - startAngle;
  // duration is proportional to the angle difference.
  const duration = maxDuration * Math.abs(angleDiff) / 180;

  const step = () => {
    const currentTime = window.performance.now();
    const progress = Math.min(1, (currentTime - startTime) / duration);
    if (progress < 1) {
      onAnimStep(startAngle + angleDiff * easeInOut(progress));
      window.requestAnimationFrame(step);
    } else {
      // Use endPosition avoid floating-point error.
      onAnimStep(endAngle);
      onEnd?.();
    }
  };
  window.requestAnimationFrame(step);
}

function easeInOut(t: number) {
  return t * t * (3.0 - 2.0 * t);
}
