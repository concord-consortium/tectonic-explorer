import { hsv } from 'd3-hsv';
import Sphere from '../peels/sphere';
import config from '../config';
import Plate from './plate';

export default function generatePlates(imgData, initFunction) {
  const plates = {};
  const sphere = new Sphere({divisions: config.divisions});
  sphere.fromRaster(imgData.data, imgData.width, imgData.height, 4, function (r, g, b) {
    // Plate is defined by 'hue' component of the color.
    // 'value' component will define elevation in the future.
    const color = hsv(`rgb(${r},${g},${b})`);
    const key = Math.round(color.h); // hue
    if (plates[key] === undefined) {
      plates[key] = new Plate({ color });
    }
    // Add this field to given plate.
    // `this` is an instance of peels.Field.
    plates[key].addField(this.id);
  });
  // User-provided function that can modify default options of all the plates.
  if (initFunction) {
    initFunction(plates);
  }
  return Object.values(plates);
}
