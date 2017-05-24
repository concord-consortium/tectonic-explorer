import { hsv } from 'd3-hsv';
import Sphere from '../peels/sphere';
import config from '../config';
import Plate from './plate';

function getElevation(col) {
  // Map [0.2, 1.0] range to [0, 1].
  return (col.v - 0.2) / 0.8;
}

function getType(elevation) {
  return elevation > 0.25 ? 'continent' : 'ocean';
}

export default function generatePlates(imgData, initFunction) {
  const plates = {};
  const sphere = new Sphere({divisions: config.divisions});
  sphere.fromRaster(imgData.data, imgData.width, imgData.height, 4, function (r, g, b) {
    // `this` is an instance of peels.Field.
    const fieldId = this.id;
    // Plate is defined by 'hue' component of the color.
    // 'value' component will define elevation in the future.
    const color = hsv(`rgb(${r},${g},${b})`);
    const key = Math.round(color.h / 10) * 10; // round hue value to 10, 20, 30, ..., 250 values.
    const elevation = getElevation(color);
    const type = getType(elevation);

    if (plates[key] === undefined) {
      plates[key] = new Plate({ color });
    }
    plates[key].addField(fieldId, type, elevation);
  });
  Object.values(plates).forEach(plate => plate.updateInertiaTensor());
  // User-provided function that can modify default options of all the plates.
  if (initFunction) {
    initFunction(plates);
  }
  return Object.values(plates);
}
