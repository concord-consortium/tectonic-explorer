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
import { cssColToRGBAFloat, RGBAFloat } from "./utils";

interface IRockPattern {
  imgElement: HTMLImageElement;
  patternImgSrc: string;
  mainColor: string;
}

const ROCK_PATTERN: Record<Rock, IRockPattern> = {
  [Rock.Granite]: {
    imgElement: new Image(),
    patternImgSrc: granitePatternImgSrc,
    mainColor: "#ebc0d9"
  },
  [Rock.Gabbro]: {
    imgElement: new Image(),
    patternImgSrc: gabbroPatternImgSrc,
    mainColor: "#7b7b96",
  },
  [Rock.Basalt]: {
    imgElement: new Image(),
    patternImgSrc: basaltPatternImgSrc,
    mainColor: "#c2c2db",
  },
  [Rock.Andesite]: {
    imgElement: new Image(),
    patternImgSrc: andesitePatternImgSrc,
    mainColor: "#bea2db",
  },
  [Rock.Diorite]: {
    imgElement: new Image(),
    patternImgSrc: dioritePatternImgSrc,
    mainColor: "#e5b3e8",
  },
  [Rock.Rhyolite]: {
    imgElement: new Image(),
    patternImgSrc: rhyolitePatternImgSrc,
    mainColor: "#fbd9ec",
  },
  [Rock.Sandstone]: {
    imgElement: new Image(),
    patternImgSrc: sandstonePatternImgSrc,
    mainColor: "#fbe770",
  },
  [Rock.Limestone]: {
    imgElement: new Image(),
    patternImgSrc: limestonePatternImgSrc,
    mainColor: "#f1c8b1",
  },
  [Rock.Shale]: {
    imgElement: new Image(),
    patternImgSrc: shalePatternImgSrc,
    mainColor: "#e5ad8d",
  },
  [Rock.OceanicSediment]: {
    imgElement: new Image(),
    patternImgSrc: oceanicSedimentPatternImgSrc,
    mainColor: "#df958f",
  },
};

const ROCK_MAIN_COLOR_RGBA_FLOAT = (() => {
  const result: Partial<Record<Rock, RGBAFloat>> = {};
  Object.keys(ROCK_PATTERN).forEach((key) => {
    const rock = key as unknown as Rock;
    result[rock] = cssColToRGBAFloat(ROCK_PATTERN[rock].mainColor);
  });
  return result as Record<Rock, RGBAFloat>;
})();

const preloadRockPatternImages = () => {
  Object.values(ROCK_PATTERN).forEach(pattern => {
    pattern.imgElement.src = pattern.patternImgSrc;
  });
};

preloadRockPatternImages();

export const getRockColor = (rock: Rock): string => ROCK_PATTERN[rock].mainColor;

export const getRockColorRGBAFloat = (rock: Rock): RGBAFloat => ROCK_MAIN_COLOR_RGBA_FLOAT[rock];

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
