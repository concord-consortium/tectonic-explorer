import React from "react";
import { newCrustAgeColors, preexistingCrustAgeColor } from "../../colors/topographic-colors";

import css from "../../../css-modules/keys/map-type.scss";

export const CrustAgeKey = () => {
  return (
    <div className={`${css.mapType} ${css.crustAgeKey}`} data-test="map-type-key">
      <div className={css.crustAgeTitle}>Key: Crust Age</div>
      <div className={css.crustAgeScale}>
        { newCrustAgeColors.map(color =>
          <div className={css.crustAgeSwatch} key={color} style={{ background: color }}/>
        ) }
      </div>
      <div className={`${css.crustAgeLabel} ${css.newestCrust}`}>Newest crust</div>
      <div className={`${css.crustAgeLabel} ${css.oldestCrust}`}>Oldest crust</div>
      <div className={`${css.crustAgeSwatch} ${css.preexistingSwatch}`} key="preexisting"
        style={{ background: preexistingCrustAgeColor }}/>
      <div className={`${css.crustAgeLabel} ${css.preexistingCrust}`}>Pre-existing crust</div>
    </div>
  );
};
