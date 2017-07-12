export default function generateContinent (plate, fieldId) {
  const queue = []
  const visited = {}
  const distance = {}
  queue.push(plate.fields.get(fieldId))
  distance[fieldId] = 0
  visited[fieldId] = true

  while (queue.length > 0) {
    const field = queue.shift()
    field.type = 'continent'
    field.baseElevation = 0.6 + Math.random() * 0.1

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
