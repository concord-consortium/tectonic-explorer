import React from "react";
import { ElevationDescriptions } from "./elevation-descriptions";
import { ElevationLabels } from "./elevation-labels";
import { elevationKeyHeight } from "./key-types";
import TopographicColorKey from "../../../images/topographic-color-key.svg";

import css from "../../../css-modules/keys/map-type.less";

export const ElevationKey = () => {
  return (
    <div className={`${css.mapType} ${css.elevationKey}`} data-test="map-type-key">
      <div className={css.elevationTitle}>Key: Topographic (Elevation)</div>
      <div className={css.elevationColors}>
        <ElevationLabels keyHeight={elevationKeyHeight}/>
        <TopographicColorKey className={css.topographicKey}/>
        <ElevationDescriptions keyHeight={elevationKeyHeight}/>
      </div>
    </div>
  );
};
