import { Rock } from "../plates-model/rock-properties";
import granitePatternImgSrc from "../../images/rock-patterns/granite.png";
import basaltPatternImgSrc from "../../images/rock-patterns/basalt.png";
import gabbroPatternImgSrc from "../../images/rock-patterns/gabbro.png";
import oceanicSedimentPatternImgSrc from "../../images/rock-patterns/oceanic sediment.png";
import shalePatternImgSrc from "../../images/rock-patterns/shale.png";
import limestonePatternImgSrc from "../../images/rock-patterns/limestone.png";
import sandstonePatternImgSrc from "../../images/rock-patterns/sandstone.png";
import rhyolitePatternImgSrc from "../../images/rock-patterns/rhyolite.png";
import andesitePatternImgSrc from "../../images/rock-patterns/andesite.png";
import dioritePatternImgSrc from "../../images/rock-patterns/diorite.png";
import { cssColorToRGBAFloat, RGBAFloat } from "./utils";

interface IRockPattern {
  imgElement: HTMLImageElement;
  patternImgSrc: string;
  mainColor: string;
  mainColorRGBAFloat: RGBAFloat;
}

// Use any RGBAFloat color to satisfy IRockPattern interface requirements. 
// The real value is assigned in preprocessRockPatterns function.
const placeholderColor = { r: 0, g: 0, b: 0, a: 0 };
const ROCK_PATTERN: Record<Rock, IRockPattern> = {
  [Rock.Granite]: {
    imgElement: new Image(),
    patternImgSrc: granitePatternImgSrc,
    mainColor: "#ebc0d9",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Gabbro]: {
    imgElement: new Image(),
    patternImgSrc: gabbroPatternImgSrc,
    mainColor: "#000000",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Basalt]: {
    imgElement: new Image(),
    patternImgSrc: basaltPatternImgSrc,
    mainColor: "#3b3b3f",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Andesite]: {
    imgElement: new Image(),
    patternImgSrc: andesitePatternImgSrc,
    mainColor: "#dbaaf2",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Diorite]: {
    imgElement: new Image(),
    patternImgSrc: dioritePatternImgSrc,
    mainColor: "#b280e7",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Rhyolite]: {
    imgElement: new Image(),
    patternImgSrc: rhyolitePatternImgSrc,
    mainColor: "#ffd2ec",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Sandstone]: {
    imgElement: new Image(),
    patternImgSrc: sandstonePatternImgSrc,
    mainColor: "#fbe770",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Limestone]: {
    imgElement: new Image(),
    patternImgSrc: limestonePatternImgSrc,
    mainColor: "#d1eaff",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.Shale]: {
    imgElement: new Image(),
    patternImgSrc: shalePatternImgSrc,
    mainColor: "#e5ad8d",
    mainColorRGBAFloat: placeholderColor
  },
  [Rock.OceanicSediment]: {
    imgElement: new Image(),
    patternImgSrc: oceanicSedimentPatternImgSrc,
    mainColor: "#b98843",
    mainColorRGBAFloat: placeholderColor
  },
};

const preprocessRockPatterns = () => {
  Object.values(ROCK_PATTERN).forEach(pattern => {
    // Preload image.
    pattern.imgElement.src = pattern.patternImgSrc;
    // Convert hex color to RGBAFloat.
    pattern.mainColorRGBAFloat = cssColorToRGBAFloat(pattern.mainColor);
  });
};

preprocessRockPatterns();

export const getRockColor = (rock: Rock): string => ROCK_PATTERN[rock].mainColor;

export const getRockColorRGBAFloat = (rock: Rock): RGBAFloat => ROCK_PATTERN[rock].mainColorRGBAFloat;

export const getRockPatternImgSrc = (rock: Rock): string => ROCK_PATTERN[rock].patternImgSrc;

export const getRockCanvasPattern = (ctx: CanvasRenderingContext2D, rock: Rock) => {
  const pattern = ROCK_PATTERN[rock];
  let canvasPattern = null;
  if (pattern.patternImgSrc !== "" && pattern.imgElement.complete) {
    canvasPattern = ctx.createPattern(pattern.imgElement, "repeat");
  }
  // Return main color while image is still loading or pattern image is not defined.
  return canvasPattern !== null ? canvasPattern : pattern.mainColor;
};
