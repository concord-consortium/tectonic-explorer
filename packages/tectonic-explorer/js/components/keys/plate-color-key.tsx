import React from "react";
import { observer } from "mobx-react";
import ModelStore from "../../stores/model-store";
import { hueToColor } from "../../colors/utils";
import { ElevationDescriptions } from "./elevation-descriptions";
import { ElevationLabels } from "./elevation-labels";
import { plateColorKeyHeight } from "./key-types";

import css from "../../../css-modules/keys/map-type.scss";

interface IProps {
  model: ModelStore;
}

// This is based on the available width in the key container.
const MAX_PLATES_IN_KEY = 5;

export const PlateColorKey = observer(({ model }: IProps) => {
  const plates = model.plates.sort((a, b) => a.id - b.id).slice(0, MAX_PLATES_IN_KEY);
  return (
    <div className={`${css.mapType} ${css.plateColorKey}`} data-test="map-type-key">
      <div className={css.plateColorTitle}>Key: Plate Color (with elevation)</div>
      <div className={css.plateColorGradients}>
        <ElevationLabels keyHeight={plateColorKeyHeight} />
        {
          plates.map(plate => (
            <PlateGradient key={plate.id} id={plate.id} hue={plate.hue} />
          ))
        }
        <ElevationDescriptions keyHeight={plateColorKeyHeight} />
      </div>
    </div>
  );
});

// This SVG is directly copied from UI spec assets. It has a few properties configurable (id and gradient colors stop).
const PlateGradient = ({ id, hue }: { id: number, hue: number }) => (
  <svg width="20" height="129" viewBox="0 0 20 129" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id={`plate-gradient-${id}`}>
        <stop stopColor={hueToColor(hue, 1.0)} offset="0%" />
        <stop stopColor={hueToColor(hue, 0.7)} offset="50.251%" />
        <stop stopColor={hueToColor(hue, 0.4)} offset="100%" />
      </linearGradient>
      <filter x="-66.7%" y="-35.3%" width="233.3%" height="170.6%" filterUnits="objectBoundingBox" id={`plate-text-filter-${id}`}>
        <feOffset in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur stdDeviation="2" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" in="shadowBlurOuter1" />
      </filter>
      { /* Font size and text position is adjusted when number of digit changes. */ }
      <text id={`plate-text-${id}`} fontFamily="Lato-Bold, Lato" fontSize={id < 9 ? 14 : (id < 99 ? 12 : 10 )} fontWeight="bold" fill="#FFF">
        <tspan x={id < 9 ? 5.94 : (id < 99 ? 3.04 : 1.05)} y={id < 9 ? 14.5 : (id < 99 ? 14 : 13.5)}>{ id + 1 }</tspan>
      </text>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path stroke="#434343" fill={`url(#plate-gradient-${id})`} d="M.5 25.5h19v99H.5z" transform="translate(0 4)" />
      <path stroke="#FFF" strokeDasharray="2,2" d="M1 79h18" />
      <g transform="translate(0 4)">
        <circle fill={hueToColor(hue, 0.7)} fillRule="nonzero" cx="10" cy="10" r="10" />
        <g fill="#FFF">
          <use filter={`url(#plate-text-filter-${id})`} xlinkHref={`#plate-text-${id}`} />
          <use xlinkHref={`#plate-text-${id}`} />
        </g>
      </g>
    </g>
  </svg>
);
