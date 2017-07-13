export default function plateDrawTool (plate, fieldId, type) {
  const queue = []
  const visited = {}
  const distance = {}
  queue.push(plate.fields.get(fieldId))
  distance[fieldId] = 0
  visited[fieldId] = true

  while (queue.length > 0) {
    const field = queue.shift()
    field.type = type
    field.baseElevation = type === 'ocean' ? 0.25 : 0.6 + Math.random() * 0.1

    const newDistance = distance[field.id] + Math.random() * 5
    field.forEachNeighbour(otherField => {
      if (!visited[otherField.id] && newDistance < 7) {
        visited[otherField.id] = true
        distance[otherField.id] = newDistance
        queue.push(otherField)
      }
      if (visited[otherField.id] && newDistance < distance[otherField.id]) {
        distance[otherField.id] = newDistance
      }
    })
  }
}
