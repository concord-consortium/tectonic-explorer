import config, { Colormap } from "./config";
import PlanetCrustAgePNG from "../images/planet-crust-age/planet-crust-age@3x.png";
import PlanetPlateColorPNG from "../images/planet-plate-color/planet-plate-color@3x.png";
import PlanetRockTypesPNG from "../images/planet-rock-types/planet-rock-types@3x.png";
import PlanetTopographicPNG from "../images/planet-topographic/planet-topographic@3x.png";

const COLORMAP_OPTIONS: { label: string, value: Colormap, image: any }[] = [
  { value: "topo", label: "Topographic", image: PlanetTopographicPNG },
  { value: "plate", label: "Plate Color", image: PlanetPlateColorPNG },
  { value: "age", label: "Crust Age", image: PlanetCrustAgePNG },
  { value: "rock", label: "Rock Type", image: PlanetRockTypesPNG }
];

export function getColorMapImage(colorMap: Colormap) {
  return COLORMAP_OPTIONS.find(item => item.value === colorMap)?.image;
}

export function getColorMapLabel(colorMap: Colormap) {
  return COLORMAP_OPTIONS.find(item => item.value === colorMap)?.label;
}

export function getAvailableColorMaps(_config: Record<string, any>) {
  const disableRockMap = _config.geode || (_config.rockLayers === false);
  const baseOptions: Colormap[] = _config.colormapOptions || ["topo", "plate", "age", "rock"];
  const options = baseOptions.filter(map => !((map === "rock") && disableRockMap));
  // must have at least one option available
  (options.length === 0) && options.push("topo");
  // filter the color map array based on the available options
  return COLORMAP_OPTIONS.filter(option => options.includes(option.value));
}

export const availableColorMaps = getAvailableColorMaps(config);
