import * as THREE from 'three'

const RECT_ASPECT_RATIO = 0.5

export function shouldSwapDirection (p1, p2) {
  if (!p1 || !p2) {
    return false
  }
  // A bit of math based on: https://stackoverflow.com/a/5190354
  // Basically, direction should be swapped when p2 is on the "left side" of p1.
  // Of course "left" is relative, but it's left when you look at the planet surface.
  const normal = p1.clone()
  const v1 = new THREE.Vector3(0, 1, 0)
  const v2 = p2.clone().sub(p1).normalize()
  const cross = v2.cross(v1)
  return cross.dot(normal) < 0
}

function rotatePoint (p1, p2, angle) {
  // This might seem a bit overcomplicated, but it ensures that points are on the surface of the planet.
  const p190Deg = p1.clone().applyAxisAngle(p2, angle)
  const rotation = new THREE.Quaternion()
  rotation.setFromUnitVectors(p2, p190Deg)
  const finalRotation = new THREE.Quaternion()
  finalRotation.slerp(rotation, RECT_ASPECT_RATIO)
  return p2.clone().applyQuaternion(finalRotation)
}

export function getCrossSectionRectangle (p1, p2) {
  const swap = shouldSwapDirection(p1, p2)
  const angle = Math.PI * 0.5 * (swap ? 1 : -1)
  const p3 = rotatePoint(p1, p2, angle)
  const p4 = rotatePoint(p2, p1, -angle)
  return {
    p1, p2, p3, p4
  }
}

// Returns a function which returns 1 for (min + max) / 2, and 0 at min and max.
function getNormFunc (min, max) {
  const middle = (min + max) / 2
  const range = Math.abs((max - min) / 2)
  return function (v) {
    if (v < min) return 0
    if (v > max) return 0
    return 1 - Math.abs(v - middle) / range
  }
}

export function getCrossSectionLinesVisibility (p1, p2, p3, p4, cameraAngle) {
  if (!p3 || !p4) {
    return null
  }
  const swap = shouldSwapDirection(p1, p2)
  return {
    p1p2: getNormFunc(-90, 90)(cameraAngle),
    p2p3: swap ? getNormFunc(-180, 0)(cameraAngle) : getNormFunc(0, 180)(cameraAngle),
    p4p1: swap ? getNormFunc(0, 180)(cameraAngle) : getNormFunc(-180, 0)(cameraAngle),
    // Special case, as range looks like this:  -90, -91, -92, ..., -179, 180, 179, ..., 3, 2, 1.
    p3p4: (Math.max(90, Math.abs(cameraAngle)) - 90) / 90
  }
}
