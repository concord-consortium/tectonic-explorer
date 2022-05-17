import { observer } from "mobx-react";
import React from "react";
import ModelStore from "../../stores/model-store";
import Plate1Color from "../../../images/plate-1-color.svg";
import Plate2Color from "../../../images/plate-2-color.svg";
import Plate2ColorAlt from "../../../images/plate-2-color-alt.svg";
import Plate3Color from "../../../images/plate-3-color.svg";
import Plate3ColorAlt from "../../../images/plate-3-color-alt.svg";
import Plate4Color from "../../../images/plate-4-color.svg";
import Plate5Color from "../../../images/plate-5-color.svg";

import css from "../../../css-modules/keys/map-type.less";

const plateCountToPlateColors: any[][] = [
  [Plate1Color],
  [Plate1Color, Plate2Color],
  [Plate1Color, Plate2ColorAlt, Plate3ColorAlt],
  [Plate1Color, Plate2Color, Plate3Color, Plate4Color],
  [Plate1Color, Plate2Color, Plate3Color, Plate4Color, Plate5Color],
];
interface IProps {
  model: ModelStore;
}

export const PlateColorKey = observer(({ model }: IProps) => {
  const plateColors = plateCountToPlateColors[model.plates.length - 1];
  return (
    <div className={`${css.mapType} ${css.plateColorKey}`} data-test="map-type-key">
      <div className={css.plateColorTitle}>Key: Plate Color (with elevation)</div>
      <div className={css.plateColorGradients}>
        <ElevationLabels/>
        { plateColors.map((PlateColorGradient, i) => (
          <PlateColorGradient className={css.plateColorGradient} key={`key-plate-${i}`} />)) }
        <ElevationDescriptions/>
      </div>
    </div>
  );
});

const ElevationLabels = () => {
  const labels = ["8,000m\u00a0–", "4,000m\u00a0–", "0m\u00a0–", "–4,000m\u00a0–", "–8,000m\u00a0–"];
  return (
    <div className={css.elevationLabels}>
      { labels.map((label, i) => <div className={css.elevationLabel} key={`label-${i}`}>{ label }</div>) }
    </div>
  );
};

const ElevationDescriptions = () => {
  const descriptions = ["Highest Mountains", "Sea Level", "Deepest Trenches"];
  return (
    <div className={css.elevationDescriptions}>
      { descriptions.map((description, i) => (
        <div className={css.elevationDescription} key={`description-${i}`}>
          { i !== 1 && <div className={css.elevationDescDash}>–</div> }
          { i === 1 &&
            // dashed line behind "Sea Level"
            <svg className={css.elevationDescSeaLevel} >
              <line x1="0" y1="11" x2="96" y2="11" stroke="#434343" strokeDasharray="2"/>
            </svg> }
          <div className={css.elevationDescText}>{ description }</div>
        </div>)) }
    </div>
  );
};
