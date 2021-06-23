import Subduction from "./subduction";
import VolcanicActivity from "./volcanic-activity";
import Field from "./field";

function applyDragForces(bottomField: Field, topField: Field) {
  if (topField.plate.isSubplate || bottomField.plate.isSubplate) {
    console.warn("Unexpected drag forces applied to subplates.");
    return;
  }
  bottomField.draggingPlate = topField.plate;
  topField.draggingPlate = bottomField.plate;
}

function subduction(bottomField: Field, topField: Field, addVolcanicActivity = true) {
  if (!bottomField.subduction) {
    bottomField.subduction = new Subduction(bottomField);
  }
  bottomField.subduction.setCollision(topField);
  if (addVolcanicActivity) { 
    if (!topField.volcanicAct) {
      topField.volcanicAct = new VolcanicActivity(topField);
    }
    topField.volcanicAct.setCollision(bottomField);
  }
}

function orogeny(bottomField: Field, topField: Field) {
  applyDragForces(bottomField, topField);
  if (!bottomField.subduction) {
    bottomField.subduction = new Subduction(bottomField);
  }
  bottomField.subduction.setCollision(topField);
}

export default function fieldsCollision(bottomField: Field, topField: Field) {
  bottomField.colliding = topField;
  topField.colliding = bottomField;

  if (bottomField.crust.canSubduct()) {
    subduction(bottomField, topField);
    if (bottomField.isContinentBuffer && !topField.continentalCrust && !topField.isContinentBuffer) {
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      // There's one exception - when both fields are continent buffers, it means continents are about to collide soon.
      // Don't apply forces in this case, so the orogeny can actually happen.
      applyDragForces(bottomField, topField);
    }
  } else {
    if (!topField.crust.canSubduct()) {
      orogeny(bottomField, topField);
    } else if (topField.isContinentBuffer) {
      // Continents are next to each other. They will collide soon. Remove oceanic field to let that happen.
      topField.alive = false;
    } else { // top field is an ocean
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      applyDragForces(bottomField, topField);
    }
  }
}
