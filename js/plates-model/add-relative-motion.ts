import * as THREE from "three";
import { random } from "../seedrandom";
import Plate from "./plate";

function randomVec3() {
  return new THREE.Vector3(random(), random(), random());
}

export default function addRelativeMotion(plates: Plate[]) {
  for (const plate of plates) {
    const pos = randomVec3().normalize();
    // .cross() ensures that force vector is perpendicular to the earth surface.
    const force = pos.clone().cross(randomVec3()).setLength(random() * 0.5 + 0.2);
    plate.setHotSpot(pos, force);
  }
}
