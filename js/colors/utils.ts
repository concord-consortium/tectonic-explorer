import { RGBColor, rgb } from "d3-color";

// Color object used internally by 3D rendering. RGB values are within [0, 1] range.
export type RGBAFloat = { r: number; g: number; b: number; a: number; };

const toFloatRGB = 1 / 255;
export function d3RGBToRGBAFloat(d3Rgb: RGBColor): RGBAFloat {
  return { r: d3Rgb.r * toFloatRGB, g: d3Rgb.g * toFloatRGB, b: d3Rgb.b * toFloatRGB, a: d3Rgb.opacity };
}

export function cssColToRGBAFloat(cssColorSpecifier: string): RGBAFloat {
  return d3RGBToRGBAFloat(rgb(cssColorSpecifier));
}

export function RGBAFloatToHexNumber(rgbF: RGBAFloat): number {
  return Math.pow(2, 16) * Math.round(rgbF.r * 255) + Math.pow(2, 8) * Math.round(rgbF.g * 255) + Math.round(rgbF.b * 255);
}


export function RGBAFloatToCssCol(c: RGBAFloat) {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
}
