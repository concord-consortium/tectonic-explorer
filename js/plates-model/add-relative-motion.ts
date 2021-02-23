import * as THREE from "three";
import { random } from "../seedrandom";

function randomVec3() {
  return new THREE.Vector3(random(), random(), random());
}

function removeDraggingFields(plates: any) {
  const platesCount = plates.length;
  for (let i = platesCount - 1; i >= 0; i -= 1) {
    const bottomPlate = plates[i];
    bottomPlate.forEachField((bottomField: any) => {
      if (!bottomField.draggingPlate) {
        return;
      }
      for (let j = i - 1; j >= 0; j -= 1) {
        const topPlate = plates[j];
        const topField = topPlate.fieldAtAbsolutePos(bottomField.absolutePos);
        if (topField) {
          bottomPlate.deleteField(bottomField.id);
          return;
        }
      }
    });
  }
}

function deleteSubductingFields(plates: any) {
  plates.forEach((plate: any) => {
    plate.forEachField((field: any) => {
      if (field.subduction) {
        plate.deleteField(field.id);
      }
    });
  });
}

export default function addRelativeMotion(plates: any) {
  // Remove fields that cause drag force and add some random hot spots.
  removeDraggingFields(plates);
  deleteSubductingFields(plates);
  for (const plate of plates) {
    plate.angularVelocity.setLength(plate.angularSpeed * 0.5);
    const fields = Array.from(plate.fields.values());
    const randomField = fields[Math.floor(fields.length * random())];
    const pos = (randomField as any).absolutePos.clone().normalize();
    // .cross() ensures that force vector is perpendicular to the earth surface.
    const force = pos.clone().cross(randomVec3()).setLength(2);
    plate.setHotSpot(pos, force);
  }
}
