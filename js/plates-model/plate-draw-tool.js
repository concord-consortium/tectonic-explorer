const MAX_CONTINENTAL_CRUST_RATIO = 0.5
const MAX_DIST = 7
const SHELF_ELEVATION = 0.48

export default function plateDrawTool (plate, fieldId, type) {
  const plateSize = plate.size
  let continentSize = 0
  if (type === 'continent') {
    plate.fields.forEach(field => {
      if (field.continentalCrust) {
        continentSize += 1
      }
    })
    if ((continentSize + 1) / plateSize > MAX_CONTINENTAL_CRUST_RATIO) {
      return
    }
  }

  const queue = []
  const visited = {}
  const distance = {}
  queue.push(plate.fields.get(fieldId))
  distance[fieldId] = 0
  visited[fieldId] = true

  while (queue.length > 0) {
    const field = queue.shift()
    if (type === 'continent' && field.isOcean) {
      continentSize += 1
    }
    field.type = type
    field.setDefaultProps()
    if (type === 'continent') {
      field.baseElevation += 0.1 * Math.random()
    }
    const newDistance = distance[field.id] + 1 + 3 * Math.random()
    const continentAreaWithinLimit = type === 'ocean' || (continentSize + 1) / plateSize <= MAX_CONTINENTAL_CRUST_RATIO
    if (newDistance <= MAX_DIST && continentAreaWithinLimit) {
      field.forEachNeighbour(otherField => {
        if (!visited[otherField.id]) {
          visited[otherField.id] = true
          distance[otherField.id] = newDistance
          queue.push(otherField)
        }
        if (visited[otherField.id] && newDistance < distance[otherField.id]) {
          distance[otherField.id] = newDistance
        }
      })
    } else if (type === 'continent' && field.anyNeighbour(otherField => otherField.isOcean)) {
      // Continent drawing mode. The edge of the continent should have a bit lower elevation, so the transition
      // between ocean and continent is smooth.
      field.baseElevation = SHELF_ELEVATION
    } else if (type === 'ocean') {
      // Continent erasing mode. The same idea - making sure that the transition between ocean and continent is smooth.
      field.forEachNeighbour(otherField => {
        if (otherField.isContinent) {
          otherField.baseElevation = SHELF_ELEVATION
        }
      })
    }
  }
}
