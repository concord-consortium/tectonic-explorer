import Subduction from "./subduction";
import Orogeny from "./orogeny";
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

function islandCollision(bottomField: Field, topField: Field) {
  if (topField.plate.isSubplate) {
    console.warn("Unexpected island collision with subplate");
    return;
  }
  // Island collision (it will be merged with colliding plate).
  topField.plate.mergeIsland(bottomField, topField);
}

function orogeny(bottomField: Field, topField: Field) {
  applyDragForces(bottomField, topField);
  if (!bottomField.orogeny) {
    bottomField.orogeny = new Orogeny(bottomField);
  }
  if (!topField.orogeny) {
    topField.orogeny = new Orogeny(topField);
  }
  bottomField.orogeny.setCollision(topField);
  topField.orogeny.setCollision(bottomField);
}

export default function fieldsCollision(bottomField: Field, topField: Field) {
  bottomField.colliding = topField;
  topField.colliding = bottomField;

  if (bottomField.isOcean) {
    subduction(bottomField, topField);
    if (bottomField.isContinentBuffer && !topField.isContinent && !topField.isContinentBuffer) {
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      // There's one exception - when both fields are continent buffers, it means continents are about to collide soon.
      // Don't apply forces in this case, so the orogeny can actually happen.
      applyDragForces(bottomField, topField);
    }
  } else if (bottomField.isContinent) {
    if (topField.isContinent) {
      orogeny(bottomField, topField);
    } else if (topField.isContinentBuffer) {
      // Continents are next to each other. They will collide soon. Remove oceanic field to let that happen.
      topField.alive = false;
    } else { // topField.isOcean || topField.isIsland
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      applyDragForces(bottomField, topField);
    }
  } else if (bottomField.isIsland) {
    islandCollision(bottomField, topField);
  }
}
