import frame00 from "../../images/div-boundary-magma-frames/00.png";
import frame01 from "../../images/div-boundary-magma-frames/01.png";
import frame02 from "../../images/div-boundary-magma-frames/02.png";
import frame03 from "../../images/div-boundary-magma-frames/03.png";
import frame04 from "../../images/div-boundary-magma-frames/04.png";
import frame05 from "../../images/div-boundary-magma-frames/05.png";
import frame06 from "../../images/div-boundary-magma-frames/06.png";
import frame07 from "../../images/div-boundary-magma-frames/07.png";
import frame08 from "../../images/div-boundary-magma-frames/08.png";
import frame09 from "../../images/div-boundary-magma-frames/09.png";
import frame10 from "../../images/div-boundary-magma-frames/10.png";
import frame11 from "../../images/div-boundary-magma-frames/11.png";
import frame12 from "../../images/div-boundary-magma-frames/12.png";
import frame13 from "../../images/div-boundary-magma-frames/13.png";
import frame14 from "../../images/div-boundary-magma-frames/14.png";
import frame15 from "../../images/div-boundary-magma-frames/15.png";
import frame16 from "../../images/div-boundary-magma-frames/16.png";
import frame17 from "../../images/div-boundary-magma-frames/17.png";
import frame18 from "../../images/div-boundary-magma-frames/18.png";
import frame19 from "../../images/div-boundary-magma-frames/19.png";
import frame20 from "../../images/div-boundary-magma-frames/20.png";
import frame21 from "../../images/div-boundary-magma-frames/21.png";
import frame22 from "../../images/div-boundary-magma-frames/22.png";
import frame23 from "../../images/div-boundary-magma-frames/23.png";
import frame24 from "../../images/div-boundary-magma-frames/24.png";
import frame25 from "../../images/div-boundary-magma-frames/25.png";
import frame26 from "../../images/div-boundary-magma-frames/26.png";
import frame27 from "../../images/div-boundary-magma-frames/27.png";
import frame28 from "../../images/div-boundary-magma-frames/28.png";
import frame29 from "../../images/div-boundary-magma-frames/29.png";
import frame30 from "../../images/div-boundary-magma-frames/30.png";
import frame31 from "../../images/div-boundary-magma-frames/31.png";
import frame32 from "../../images/div-boundary-magma-frames/32.png";
import frame33 from "../../images/div-boundary-magma-frames/33.png";
import frame34 from "../../images/div-boundary-magma-frames/34.png";
import frame35 from "../../images/div-boundary-magma-frames/35.png";
import frame36 from "../../images/div-boundary-magma-frames/36.png";
import frame37 from "../../images/div-boundary-magma-frames/37.png";
import frame38 from "../../images/div-boundary-magma-frames/38.png";
import frame39 from "../../images/div-boundary-magma-frames/39.png";

const getImg = (src: string) => {
  const img = new Image();
  img.src = src;
  return img;
};

const divergentBoundaryMagmaFrames: HTMLImageElement[] = [
  getImg(frame00), getImg(frame01), getImg(frame02), getImg(frame03), getImg(frame04), getImg(frame05), getImg(frame06),
  getImg(frame07), getImg(frame08), getImg(frame09), getImg(frame10), getImg(frame11), getImg(frame12), getImg(frame13),
  getImg(frame14), getImg(frame15), getImg(frame16), getImg(frame17), getImg(frame18), getImg(frame19), getImg(frame20),
  getImg(frame21), getImg(frame22), getImg(frame23), getImg(frame24), getImg(frame25), getImg(frame26), getImg(frame27),
  getImg(frame28), getImg(frame29), getImg(frame30), getImg(frame31), getImg(frame32), getImg(frame33), getImg(frame34),
  getImg(frame35), getImg(frame36), getImg(frame37), getImg(frame38), getImg(frame39)
];


// Very simple approach to "animation". Divergent boundary magma will be clipped. Animation progress is defined
// by number of draw calls. It only a small visual hint and it doesn't have to correlated with the real model.
export let divBoundaryMagmaFrameIdx = 0;

export const divBoundaryMagmaFrameCount = divergentBoundaryMagmaFrames.length;

setInterval(() => {
  divBoundaryMagmaFrameIdx = ((divBoundaryMagmaFrameIdx + 1) % divBoundaryMagmaFrameCount);
}, 1000 / 8);

export const getDivergentBoundaryMagmaFrame = (): HTMLImageElement => {
  return divergentBoundaryMagmaFrames[divBoundaryMagmaFrameIdx];
};

export const getDivergentBoundaryMagmaAnimProgress = () => divBoundaryMagmaFrameIdx / divBoundaryMagmaFrameCount;

