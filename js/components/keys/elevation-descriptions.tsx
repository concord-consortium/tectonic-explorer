import React from "react";
import { keyBaseHeight } from "./key-types";

import css from "../../../css-modules/keys/elevation-descriptions.less";

interface IProps {
  keyHeight: number;
}

// top values for keys with the base height
const descriptionBaseTops = [12, 68, 110];

export const ElevationDescriptions = ({ keyHeight = keyBaseHeight }: IProps) => {
  const descriptions = ["Highest Mountains", "Sea Level", "Deepest Trenches"];
  const diffHeight = keyHeight - keyBaseHeight;
  const descriptionStyles = descriptionBaseTops.map((top, i) => ({
    // distribute additional space evenly between the descriptions
    top: top + (i - 1) * diffHeight / 2
  }));
  return (
    <div className={css.elevationDescriptions}>
      { descriptions.map((description, i) => (
        <div className={css.elevationDescription} key={`description-${i}`} style={descriptionStyles[i]}>
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
