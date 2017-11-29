const MAX_CONTINENTAL_CRUST_RATIO = 0.5

function drawField (field, type, plateSize, continentSize, elevationModifier = 1) {
  if (type === 'continent' && field.isOcean && (continentSize + 1) / plateSize > MAX_CONTINENTAL_CRUST_RATIO) {
    return
  }
  field.type = type
  field.setDefaultProps()
  field.baseElevation *= elevationModifier
  if (type === 'continent') {
    field.baseElevation += 0.1 * Math.random()
  }
}

export default function plateDrawTool (plate, fieldId, type) {
  const queue = []
  const visited = {}
  const distance = {}
  queue.push(plate.fields.get(fieldId))
  distance[fieldId] = 0
  visited[fieldId] = true

  const plateSize = plate.size
  let continentSize = 0
  if (type === 'continent') {
    plate.fields.forEach(field => {
      if (field.continentalCrust) {
        continentSize += 1
      }
    })
  }

  while (queue.length > 0) {
    const field = queue.shift()
    drawField(field, type, plateSize, continentSize)

    const newDistance = distance[field.id] + Math.random() * 5
    field.forEachNeighbour(otherField => {
      if (!visited[otherField.id]) {
        if (newDistance < 7) {
          visited[otherField.id] = true
          distance[otherField.id] = newDistance
          queue.push(otherField)
        } else {
          if (type === 'continent' && otherField.type === 'ocean') {
            drawField(otherField, 'continent', plateSize, continentSize + 1, .7)
          }
        }
      }
      if (visited[otherField.id] && newDistance < distance[otherField.id]) {
        distance[otherField.id] = newDistance
      }
    })
  }
}
