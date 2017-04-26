import Sphere from '../peels/sphere';
import config from './config';
import Plate from './plate';

export default function generatePlates(preset) {
  const plate = {};
  const sphere = new Sphere({divisions: config.divisions});
  const imgData = preset.imgData;
  sphere.fromRaster(imgData.data, imgData.width, imgData.height, 4, function (r, g, b) {
    const key = `${r}-${g}-${b}`;
    if (plate[key] === undefined) {
      plate[key] = new Plate();
    }
    // Add this field to given plate.
    plate[key].setField(this.i);
  });
  return Object.values(plate);
}
