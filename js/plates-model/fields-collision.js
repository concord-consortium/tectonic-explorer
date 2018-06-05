import Subduction from './subduction'
import Orogeny from './orogeny'
import VolcanicActivity from './volcanic-activity'

function applyDragForces (bottomField, topField) {
  bottomField.draggingPlate = topField.plate
  topField.draggingPlate = bottomField.plate
}

function subduction (bottomField, topField) {
  if (!bottomField.subduction) {
    bottomField.subduction = new Subduction(bottomField)
  }
  if (!topField.volcanicAct) {
    topField.volcanicAct = new VolcanicActivity(topField)
  }
  bottomField.subduction.setCollision(topField)
  topField.volcanicAct.setCollision(bottomField)
}

function islandCollision (bottomField, topField) {
  // Island collision (it will be merged with colliding plate).
  topField.plate.mergeIsland(bottomField, topField)
}

function orogeny (bottomField, topField) {
  applyDragForces(bottomField, topField)
  if (!bottomField.orogeny) {
    bottomField.orogeny = new Orogeny(bottomField)
  }
  if (!topField.orogeny) {
    topField.orogeny = new Orogeny(topField)
  }
  bottomField.orogeny.setCollision(topField)
  topField.orogeny.setCollision(bottomField)
}

export default function fieldsCollision (bottomField, topField) {
  bottomField.colliding = true
  topField.colliding = true

  if (bottomField.isOcean) {
    subduction(bottomField, topField)
    if (bottomField.isContinentBuffer && !topField.isContinent && !topField.isContinentBuffer) {
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      // There's one exception - when both fields are continent buffers, it means continents are about to collide soon.
      // Don't apply forces in this case, so the orogeny can actually happen.
      applyDragForces(bottomField, topField)
    }
  } else if (bottomField.isContinent) {
    if (topField.isContinent) {
      orogeny(bottomField, topField)
    } else if (topField.isContinentBuffer) {
      // Continents are next to each other. They will collide soon. Remove oceanic field to let that happen.
      topField.alive = false
    } else { // topField.isOcean || topField.isIsland
      // Special case when the continent is "trying" to subduct under the ocean. Apply drag force to stop both plates.
      applyDragForces(bottomField, topField)
    }
  } else if (bottomField.isIsland) {
    islandCollision(bottomField, topField)
  }
}
