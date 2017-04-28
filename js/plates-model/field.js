import grid from './grid';

export default class Field {
  constructor(id) {
    this.id = id;
    this.localPos = grid.fields[id].localPos;
  }
}
