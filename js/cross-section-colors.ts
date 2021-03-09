import { Rock } from "./plates-model/crust";

export const OCEANIC_CRUST_COL = "#27374f";
export const CONTINENTAL_CRUST_COL = "#643d0c";
export const LITHOSPHERE_COL = "#666";
export const MANTLE_COL = "#033f19";
export const SKY_COL_1 = "#4375be";
export const SKY_COL_2 = "#c0daeb";
export const OCEAN_COL = "#1da2d8";

export const ROCKS_COL: Record<Rock, string> = {
  [Rock.Granite]: "#4b1e01",
  [Rock.Basalt]: "#06151b",
  [Rock.Gabbro]: "#5d5243",
  [Rock.AndesiticRocks]: "#585c5d",
  [Rock.MaficRocks]: "#373633",
};
