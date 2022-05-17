import { observer } from "mobx-react";
import React from "react";
import { ElevationDescriptions } from "./elevation-descriptions";
import { ElevationLabels } from "./elevation-labels";
import { plateColorKeyHeight } from "./key-types";
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
        <ElevationLabels keyHeight={plateColorKeyHeight}/>
        { plateColors.map((PlateColorGradient, i) => (
          <PlateColorGradient className={css.plateColorGradient} key={`key-plate-${i}`} />)) }
        <ElevationDescriptions keyHeight={plateColorKeyHeight}/>
      </div>
    </div>
  );
});
