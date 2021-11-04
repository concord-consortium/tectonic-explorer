import { Rock } from "../plates-model/rock-properties";
import granitePatternImgSrc from "../../images/rock-patterns/granite-cs.png";
import basaltPatternImgSrc from "../../images/rock-patterns/basalt-cs.png";
import gabbroPatternImgSrc from "../../images/rock-patterns/gabbro-cs.png";
import oceanicSedimentPatternImgSrc from "../../images/rock-patterns/oceanic-sediment-cs.png";
import shalePatternImgSrc from "../../images/rock-patterns/shale-cs.png";
import limestonePatternImgSrc from "../../images/rock-patterns/limestone-cs.png";
import sandstonePatternImgSrc from "../../images/rock-patterns/sandstone-cs.png";
import rhyolitePatternImgSrc from "../../images/rock-patterns/rhyolite-cs.png";
import andesitePatternImgSrc from "../../images/rock-patterns/andesite-cs.png";
import dioritePatternImgSrc from "../../images/rock-patterns/diorite-cs.png";
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

export const IGNEOUS_PURPLE = "#BA00BA";
export const IGNEOUS_PURPLE_LIGHT = "#FBF2FB";
export const MANTLE_PURPLE = "#6800BA";
export const MANTLE_PURPLE_LIGHT = "#F7F2FB";
export const METAMORPHIC_GREEN = "#008000";
export const METAMORPHIC_GREEN_LIGHT = "#F2F8F2";
export const SEDIMENTARY_YELLOW = "#FFBB00";
export const SEDIMENTARY_YELLOW_LIGHT = "#FFFBF2";
export const SEDIMENTARY_TITLE_GRAY = "#434343";
export const SEDIMENTS_ORANGE = "#AF5800";
export const SEDIMENTS_ORANGE_LIGHT = "#FBF6F2";
export const MAGMA_RED = "#C20000";
export const MAGMA_RED_LIGHT = "#FCF2F2";
export const OTHER_GRAY = "#696969";
export const OTHER_GRAY_LIGHT = "#F7F7F7";
