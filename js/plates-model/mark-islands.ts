import Field from "./field";
import Plate from "./plate";

// Any bigger landform is considered to be a continent, not island.
const MAX_ISLAND_SIZE = 400000; // km^2

// DFS-based algorithm which calculates area of continents and mark small ones as islands.
// It accepts either array of plates or single field. When array is provided, it'll process all the available fields.
// When a single field is provided, it will check only continuous continental crust around this field.
export default function markIslands(platesOrField: Plate[] | Field) {
  const stack: Field[] = [];
  const processedFields: Field[] = [];
  const area: Record<number, number> = {};
  const continentId: Record<number, number> = {};

  const calcAreaOfContinent = function() {
    while (stack.length > 0) {
      const field = stack.pop();
      if (field) {
        processedFields.push(field);
        const cId = continentId[field.id];
        area[cId] += field.area;
        field.forEachNeighbour((neighbour: Field) => {
          if (neighbour.continentalCrust && continentId[neighbour.id] === undefined) {
            stack.push(neighbour);
            continentId[neighbour.id] = cId;
          }
        });
      }
    }
  };

  const fieldCallback = function(field: Field) {
    if (field.continentalCrust && continentId[field.id] === undefined) {
      stack.push(field);
      continentId[field.id] = field.id;
      area[continentId[field.id]] = 0;
      calcAreaOfContinent();
    }
  };

  if (platesOrField.constructor === Array) {
    // Input: an array of plates.
    platesOrField.forEach(plate => plate.forEachField(fieldCallback));
  } else {
    // Input: a single field.
    fieldCallback(platesOrField as Field);
  }

  processedFields.forEach((field: Field) => {
    const contId = continentId[field.id];
    field.type = area[contId] <= MAX_ISLAND_SIZE ? "island" : "continent";
  });
}
