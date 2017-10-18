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
