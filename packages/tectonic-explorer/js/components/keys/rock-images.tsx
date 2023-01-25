import React from "react";
import GabbroImageSrc from "../../../images/rock-key/png/gabbro-photo.png";
import GabbroImageSrc2x from "../../../images/rock-key/png/gabbro-photo@2x.png";
import GabbroImageSrc3x from "../../../images/rock-key/png/gabbro-photo@3x.png";
import BasaltImageSrc from "../../../images/rock-key/png/basalt-photo.png";
import BasaltImageSrc2x from "../../../images/rock-key/png/basalt-photo@2x.png";
import BasaltImageSrc3x from "../../../images/rock-key/png/basalt-photo@3x.png";
import DioriteImageSrc from "../../../images/rock-key/png/diorite-photo.png";
import DioriteImageSrc2x from "../../../images/rock-key/png/diorite-photo@2x.png";
import DioriteImageSrc3x from "../../../images/rock-key/png/diorite-photo@3x.png";
import AndesiteImageSrc from "../../../images/rock-key/png/andesite-photo.png";
import AndesiteImageSrc2x from "../../../images/rock-key/png/andesite-photo@2x.png";
import AndesiteImageSrc3x from "../../../images/rock-key/png/andesite-photo@3x.png";
import GraniteImageSrc from "../../../images/rock-key/png/granite-photo.png";
import GraniteImageSrc2x from "../../../images/rock-key/png/granite-photo@2x.png";
import GraniteImageSrc3x from "../../../images/rock-key/png/granite-photo@3x.png";
import RhyoliteImageSrc from "../../../images/rock-key/png/rhyolite-photo.png";
import RhyoliteImageSrc2x from "../../../images/rock-key/png/rhyolite-photo@2x.png";
import RhyoliteImageSrc3x from "../../../images/rock-key/png/rhyolite-photo@3x.png";
import MantleImageSrc from "../../../images/rock-key/png/mantle-photo.png";
import MantleImageSrc2x from "../../../images/rock-key/png/mantle-photo@2x.png";
import MantleImageSrc3x from "../../../images/rock-key/png/mantle-photo@3x.png";
import SandstoneImageSrc from "../../../images/rock-key/png/sandstone-photo.png";
import SandstoneImageSrc2x from "../../../images/rock-key/png/sandstone-photo@2x.png";
import SandstoneImageSrc3x from "../../../images/rock-key/png/sandstone-photo@3x.png";
import ShaleImageSrc from "../../../images/rock-key/png/shale-photo.png";
import ShaleImageSrc2x from "../../../images/rock-key/png/shale-photo@2x.png";
import ShaleImageSrc3x from "../../../images/rock-key/png/shale-photo@3x.png";
import LimestoneImageSrc from "../../../images/rock-key/png/limestone-photo.png";
import LimestoneImageSrc2x from "../../../images/rock-key/png/limestone-photo@2x.png";
import LimestoneImageSrc3x from "../../../images/rock-key/png/limestone-photo@3x.png";
import OceanicImageSrc from "../../../images/rock-key/png/oceanic-sediments-photo.png";
import OceanicImageSrc2x from "../../../images/rock-key/png/oceanic-sediments-photo@2x.png";
import OceanicImageSrc3x from "../../../images/rock-key/png/oceanic-sediments-photo@3x.png";
import ContinentalImageSrc from "../../../images/rock-key/png/continental-sediments-photo.png";
import ContinentalImageSrc2x from "../../../images/rock-key/png/continental-sediments-photo@2x.png";
import ContinentalImageSrc3x from "../../../images/rock-key/png/continental-sediments-photo@3x.png";
import MagmaImageSrc from "../../../images/rock-key/png/magma-photo.png";
import MagmaImageSrc2x from "../../../images/rock-key/png/magma-photo@2x.png";
import MagmaImageSrc3x from "../../../images/rock-key/png/magma-photo@3x.png";

import css from "../../../css-modules/rock-images.scss";

interface IProps {
  src: any;
  src2x?: any;
  src3x?: any;
}
export const RockImage = ({ src, src2x, src3x }: IProps) => {
  // https://stackoverflow.com/a/34739835
  const imageSrc = src3x && (window.devicePixelRatio > 2)
                    ? src3x
                    : src2x && (window.devicePixelRatio > 1)
                      ? src2x
                      : src;
  return <div className={css.rockImage}><img src={imageSrc} /></div>;
};

export const GabbroImage = () => {
  return <RockImage src={GabbroImageSrc} src2x={GabbroImageSrc2x} src3x={GabbroImageSrc3x} />;
};

export const BasaltImage = () => {
  return <RockImage src={BasaltImageSrc} src2x={BasaltImageSrc2x} src3x={BasaltImageSrc3x} />;
};

export const DioriteImage = () => {
  return <RockImage src={DioriteImageSrc} src2x={DioriteImageSrc2x} src3x={DioriteImageSrc3x} />;
};

export const AndesiteImage = () => {
  return <RockImage src={AndesiteImageSrc} src2x={AndesiteImageSrc2x} src3x={AndesiteImageSrc3x} />;
};

export const GraniteImage = () => {
  return <RockImage src={GraniteImageSrc} src2x={GraniteImageSrc2x} src3x={GraniteImageSrc3x} />;
};

export const RhyoliteImage = () => {
  return <RockImage src={RhyoliteImageSrc} src2x={RhyoliteImageSrc2x} src3x={RhyoliteImageSrc3x} />;
};

export const MantleImage = () => {
  return <RockImage src={MantleImageSrc} src2x={MantleImageSrc2x} src3x={MantleImageSrc3x} />;
};

export const SandstoneImage = () => {
  return <RockImage src={SandstoneImageSrc} src2x={SandstoneImageSrc2x} src3x={SandstoneImageSrc3x} />;
};

export const ShaleImage = () => {
  return <RockImage src={ShaleImageSrc} src2x={ShaleImageSrc2x} src3x={ShaleImageSrc3x} />;
};

export const LimestoneImage = () => {
  return <RockImage src={LimestoneImageSrc} src2x={LimestoneImageSrc2x} src3x={LimestoneImageSrc3x} />;
};

export const OceanicSedimentsImage = () => {
  return <RockImage src={OceanicImageSrc} src2x={OceanicImageSrc2x} src3x={OceanicImageSrc3x} />;
};

export const ContinentalSedimentsImage = () => {
  return <RockImage src={ContinentalImageSrc} src2x={ContinentalImageSrc2x} src3x={ContinentalImageSrc3x} />;
};

export const MagmaImage = () => {
  return <RockImage src={MagmaImageSrc} src2x={MagmaImageSrc2x} src3x={MagmaImageSrc3x} />;
};
