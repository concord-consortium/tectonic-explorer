import generatePlates from './generate-plates';

function clamp(RGBval){
  return Math.max(Math.min(RGBval, 255), 0);
}

export default class Model {
  constructor(preset) {
    this.plates = generatePlates(preset);
  }
}
