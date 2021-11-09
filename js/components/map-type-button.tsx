import { observer } from "mobx-react";
import React from "react";
import config, { Colormap } from "../config";
import { SimulationStore } from "../stores/simulation-store";
import PlanetCrustAgePNG from "../../images/planet-crust-age/planet-crust-age@3x.png";
import PlanetPlateColorPNG from "../../images/planet-plate-color/planet-plate-color@3x.png";
import PlanetRockTypesPNG from "../../images/planet-rock-types/planet-rock-types@3x.png";
import PlanetTopographicPNG from "../../images/planet-topographic/planet-topographic@3x.png";
import ScrollIcon from "../../images/scroll-icon.svg";

import css from "../../css-modules/map-type-button.less";

export const COLORMAP_OPTIONS: { label: string, value: Colormap, image: any }[] = [
  { value: "topo", label: "Topographic", image: PlanetTopographicPNG },
  { value: "plate", label: "Plate Color", image: PlanetPlateColorPNG },
  { value: "age", label: "Crust Age", image: PlanetCrustAgePNG },
];
if (config.rockLayers) {
  COLORMAP_OPTIONS.push({ value: "rock", label: "Rock Type", image: PlanetRockTypesPNG });
}

function getNextColorMap(colorMap: Colormap) {
  const index = COLORMAP_OPTIONS.findIndex(item => item.value === colorMap);
  const newIndex = (index + 1) % COLORMAP_OPTIONS.length;
  return COLORMAP_OPTIONS[newIndex].value;
}

function getPrevColorMap(colorMap: Colormap) {
  const index = COLORMAP_OPTIONS.findIndex(item => item.value === colorMap);
  const newIndex = (index + COLORMAP_OPTIONS.length - 1) % COLORMAP_OPTIONS.length;
  return COLORMAP_OPTIONS[newIndex].value;
}

function getColorMapImage(colorMap: Colormap) {
  return COLORMAP_OPTIONS.find(item => item.value === colorMap)?.image;
}

function getColorMapLabel(colorMap: Colormap) {
  return COLORMAP_OPTIONS.find(item => item.value === colorMap)?.label;
}

interface IProps {
  className?: string;
  disabled?: boolean;
  colorMap: Colormap;
  onSetColorMap: (colorMap: Colormap) => void;
}

export const MapTypeButton: React.FC<IProps> = observer(props => {
  const { className, disabled, colorMap, onSetColorMap } = props;

  function handlePrevClick() {
    onSetColorMap(getPrevColorMap(colorMap));
  }
  function handleNextClick() {
    onSetColorMap(getNextColorMap(colorMap));
  }

  return (
    <div className={`${css.mapTypeButton} ${className}`} data-test="map-type-button" >
      <div className={`${css.title} ${disabled ? "disabled" : ""}`}>Map Type</div>
      <div className={css.middle}>
        <CaretButton direction="prev" onClick={handlePrevClick} />
        <img className={`${css.image} ${disabled ? "disabled" : ""}`} src={getColorMapImage(colorMap)} />
        <CaretButton direction="next" onClick={handleNextClick} />
      </div>
      <div className={`${css.label} ${disabled ? "disabled" : ""}`}>
        { getColorMapLabel(colorMap) }
      </div>
    </div>
  );
});

interface ICaretButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
}
const CaretButton: React.FC<ICaretButtonProps> = (({ direction, onClick }) => {
  return (
    <div className={css.caretButton}>
      <button className={css.button} onClick={onClick} data-test={`${direction}-map-type-button`}>
        <ScrollIcon className={direction} />
      </button>
    </div>
  );
});
