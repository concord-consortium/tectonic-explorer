// Any bigger landform is considered to be a continent, not island.
const MAX_ISLAND_SIZE = 300000 // km^2

// DFS-based algorithm which calculates area of continents and mark small ones as islands.
// It accepts either array of plates or single field. When array is provided, it'll process all the available fields.
// When a single field is provided, it will check only continuous continental crust around this field.
export default function markIslands (platesOrField) {
  const stack = []
  const processedFields = []
  const area = {}
  const continentId = {}

  const calcAreaOfContinent = function () {
    while (stack.length > 0) {
      const field = stack.pop()
      processedFields.push(field)
      const cId = continentId[field.id]
      area[cId] += field.area
      field.forEachNeighbour(neighbour => {
        if (neighbour.continentalCrust && continentId[neighbour.id] === undefined) {
          stack.push(neighbour)
          continentId[neighbour.id] = cId
        }
      })
    }
  }

  const fieldCallback = function (field) {
    if (field.continentalCrust && continentId[field.id] === undefined) {
      stack.push(field)
      continentId[field.id] = field.id
      area[continentId[field.id]] = 0
      calcAreaOfContinent()
    }
  }

  if (platesOrField.constructor === Array) {
    // Input: an array of plates.
    platesOrField.forEach(plate => plate.forEachField(fieldCallback))
  } else {
    // Input: a single field.
    fieldCallback(platesOrField)
  }

  processedFields.forEach(field => {
    const contId = continentId[field.id]
    field.type = area[contId] <= MAX_ISLAND_SIZE ? 'island' : 'continent'
  })
}
