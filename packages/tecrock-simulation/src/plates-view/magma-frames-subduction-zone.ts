import frame00 from "../assets/magma-frames-subduction-zone/00.png";
import frame01 from "../assets/magma-frames-subduction-zone/01.png";
import frame02 from "../assets/magma-frames-subduction-zone/02.png";
import frame03 from "../assets/magma-frames-subduction-zone/03.png";
import frame04 from "../assets/magma-frames-subduction-zone/04.png";
import frame05 from "../assets/magma-frames-subduction-zone/05.png";
import frame06 from "../assets/magma-frames-subduction-zone/06.png";
import frame07 from "../assets/magma-frames-subduction-zone/07.png";
import frame08 from "../assets/magma-frames-subduction-zone/08.png";
import frame09 from "../assets/magma-frames-subduction-zone/09.png";
import frame10 from "../assets/magma-frames-subduction-zone/10.png";
import frame11 from "../assets/magma-frames-subduction-zone/11.png";
import frame12 from "../assets/magma-frames-subduction-zone/12.png";
import frame13 from "../assets/magma-frames-subduction-zone/13.png";
import frame14 from "../assets/magma-frames-subduction-zone/14.png";
import frame15 from "../assets/magma-frames-subduction-zone/15.png";
import frame16 from "../assets/magma-frames-subduction-zone/16.png";
import frame17 from "../assets/magma-frames-subduction-zone/17.png";
import frame18 from "../assets/magma-frames-subduction-zone/18.png";
import frame19 from "../assets/magma-frames-subduction-zone/19.png";
import frame20 from "../assets/magma-frames-subduction-zone/20.png";
import frame21 from "../assets/magma-frames-subduction-zone/21.png";
import frame22 from "../assets/magma-frames-subduction-zone/22.png";
import frame23 from "../assets/magma-frames-subduction-zone/23.png";
import frame24 from "../assets/magma-frames-subduction-zone/24.png";
import frame25 from "../assets/magma-frames-subduction-zone/25.png";
import frame26 from "../assets/magma-frames-subduction-zone/26.png";
import frame27 from "../assets/magma-frames-subduction-zone/27.png";
import frame28 from "../assets/magma-frames-subduction-zone/28.png";
import frame29 from "../assets/magma-frames-subduction-zone/29.png";
import frame30 from "../assets/magma-frames-subduction-zone/30.png";
import frame31 from "../assets/magma-frames-subduction-zone/31.png";
import frame32 from "../assets/magma-frames-subduction-zone/32.png";
import frame33 from "../assets/magma-frames-subduction-zone/33.png";
import frame34 from "../assets/magma-frames-subduction-zone/34.png";
import frame35 from "../assets/magma-frames-subduction-zone/35.png";
import frame36 from "../assets/magma-frames-subduction-zone/36.png";
import frame37 from "../assets/magma-frames-subduction-zone/37.png";
import frame38 from "../assets/magma-frames-subduction-zone/38.png";
import frame39 from "../assets/magma-frames-subduction-zone/39.png";

const getImg = (src: string) => {
  const img = new Image();
  img.src = src;
  return img;
};

const subductionZoneMagmaFrames: HTMLImageElement[] = [
  getImg(frame00), getImg(frame01), getImg(frame02), getImg(frame03), getImg(frame04), getImg(frame05), getImg(frame06),
  getImg(frame07), getImg(frame08), getImg(frame09), getImg(frame10), getImg(frame11), getImg(frame12), getImg(frame13),
  getImg(frame14), getImg(frame15), getImg(frame16), getImg(frame17), getImg(frame18), getImg(frame19), getImg(frame20),
  getImg(frame21), getImg(frame22), getImg(frame23), getImg(frame24), getImg(frame25), getImg(frame26), getImg(frame27),
  getImg(frame28), getImg(frame29), getImg(frame30), getImg(frame31), getImg(frame32), getImg(frame33), getImg(frame34),
  getImg(frame35), getImg(frame36), getImg(frame37), getImg(frame38), getImg(frame39)
];


export let divBoundaryMagmaFrameIdx = 0;
export const divBoundaryMagmaFrameCount = subductionZoneMagmaFrames.length;

// It'll run even if it's not necessary, but it doesn't seem it's a significant performance hit.
setInterval(() => {
  divBoundaryMagmaFrameIdx = ((divBoundaryMagmaFrameIdx + 1) % divBoundaryMagmaFrameCount);
}, 1000 / 8);

export const getSubductionZoneMagmaFrame = () => subductionZoneMagmaFrames[divBoundaryMagmaFrameIdx];

export const getSubductionZoneMagmaAnimProgress = () => divBoundaryMagmaFrameIdx / divBoundaryMagmaFrameCount;

