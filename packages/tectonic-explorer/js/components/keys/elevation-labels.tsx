import React from "react";
import { keyBaseHeight } from "./key-types";

import css from "./elevation-labels.scss";

interface IProps {
  keyHeight: number;
}

// top values for keys with the base height
const labelBaseTops = [19, 43.5, 68, 92.5, 117];

export const ElevationLabels = ({ keyHeight = keyBaseHeight }: IProps) => {
  const labels = [
    "8,000\u00a0m\u00a0–", "4,000\u00a0m\u00a0–", "0\u00a0m\u00a0–", "–4,000\u00a0m\u00a0–", "–8,000\u00a0m\u00a0–"
  ];
  const diffHeight = keyHeight - keyBaseHeight;
  const labelStyles = labelBaseTops.map((top, i) => ({
    // distribute additional space evenly between the labels
    top: top + (i - 2) * diffHeight / 4
  }));
  return (
    <div className={css.elevationLabels}>
      { labels.map((label, i) => {
        return <div className={css.elevationLabel} key={`label-${i}`} style={labelStyles[i]}>{ label }</div>;
      }) }
    </div>
  );
};
