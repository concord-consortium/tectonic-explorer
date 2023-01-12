import { observer } from "mobx-react";
import React from "react";
import { availableColorMaps, getColorMapImage, getColorMapLabel } from "../color-maps";
import { Colormap } from "../config";
import ScrollIcon from "../../images/scroll-icon.svg";

import css from "../../css-modules/map-type-button.less";

function getNextColorMap(colorMap: Colormap) {
  const index = availableColorMaps.findIndex(item => item.value === colorMap);
  const newIndex = (index + 1) % availableColorMaps.length;
  return availableColorMaps[newIndex].value;
}

function getPrevColorMap(colorMap: Colormap) {
  const index = availableColorMaps.findIndex(item => item.value === colorMap);
  const newIndex = (index + availableColorMaps.length - 1) % availableColorMaps.length;
  return availableColorMaps[newIndex].value;
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
