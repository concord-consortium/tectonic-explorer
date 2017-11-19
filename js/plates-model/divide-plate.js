import Plate from './plate'

const MIN_SIZE = 100 // fields

function getBoundaryField (plate) {
  const adjField = plate.adjacentFields.values().next().value
  // Some neighbours of plate adjacent field is a boundary field. Pick any.
  for (let neighborId of adjField.adjacentFields) {
    if (plate.fields.has(neighborId)) {
      return plate.fields.get(neighborId)
    }
  }
}

export default function dividePlate (plate) {
  if (plate.size < MIN_SIZE) {
    return null
  }
  const startField = getBoundaryField(plate)
  const visited = { [startField.id]: true }
  const queue = [ startField ]
  const halfPlateSize = plate.size * 0.5

  const newPlate = new Plate({ color: plate.baseColor, density: plate.density })
  newPlate.quaternion.copy(plate.quaternion)
  newPlate.angularVelocity.copy(plate.angularVelocity)

  while (queue.length > 0 && newPlate.size < halfPlateSize) {
    const field = queue.shift()
    field.forEachNeighbour(adjField => {
      if (!visited[adjField.id]) {
        queue.push(adjField)
        visited[adjField.id] = true
      }
    })
    plate.deleteField(field.id)
    newPlate.addExistingField(field)
  }

  return newPlate
}
