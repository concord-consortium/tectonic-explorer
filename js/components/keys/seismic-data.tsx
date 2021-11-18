import React from "react";
import { inject, observer } from "mobx-react";
import { EARTHQUAKE_COLORS } from "../../plates-view/earthquake-helpers";
import { BaseComponent, IBaseProps } from "../base";

import css from "../../../css-modules/keys/seismic-data.less";

interface IState { }

@inject("simulationStore")
@observer
export class SeismicData extends BaseComponent<IBaseProps, IState> {
  render() {
    const { earthquakes, volcanicEruptions } = this.simulationStore;
    return (
      <div className={css.seismicData} data-test="seismic-data-key">
        {
          volcanicEruptions &&
          <table className={css.keyTable}>
            <tbody className={css.volcanoKeyContainer} data-test="seismic-key-volcanic-eruptions">
              <tr><th colSpan={4}>Key: Volcanoes</th></tr>
              <tr>
                <td colSpan={2}>&nbsp;</td>
                <td><div className={css.volcanoMarker} /></td>
                <td><div className={css.volcanoLabel}>Volcanic Eruption</div></td>
              </tr>
            </tbody>
          </table>
        }
        {
          earthquakes &&
          <table className={css.keyTable}>
            <tbody className={css.earthquakeKeyContainer} data-test="seismic-key-earthquakes">
              <tr>
                <th colSpan={4}>Key: Earthquakes</th>
              </tr>
              <tr>
                <th colSpan={4} className={css.subheader}>Magnitude and Depth</th>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(3) }</td>
                <td className={css.magnitudeText}>3</td>
                <td>{ earthquakeColor(0) }</td>
                <td className={css.earthquakeDepth}>0-30 km</td>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(5) }</td>
                <td className={css.magnitudeText}>5</td>
                <td>{ earthquakeColor(1) }</td>
                <td className={css.earthquakeDepth}>30-100 km</td>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(6) }</td>
                <td className={css.magnitudeText}>6</td>
                <td>{ earthquakeColor(2) }</td>
                <td className={css.earthquakeDepth}>100-200 km</td>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(7) }</td>
                <td className={css.magnitudeText}>7</td>
                <td>{ earthquakeColor(3) }</td>
                <td className={css.earthquakeDepth}>200-300 km</td>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(8) }</td>
                <td className={css.magnitudeText}>8</td>
                <td>{ earthquakeColor(4) }</td>
                <td className={css.earthquakeDepth}>300-500 km</td>
              </tr>
              <tr>
                <td className={css.earthquakeMagnitudeGraphic}>{ circle(9) }</td>
                <td className={css.magnitudeText}>9</td>
                <td>{ earthquakeColor(5) }</td>
                <td className={css.earthquakeDepth}>&gt; 500 km</td>
              </tr>
            </tbody>
          </table>
        }
      </div>
    );
  }
}

function circle(magnitude: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <circle cx="10" cy="10" r={magnitude} stroke="white" fill="rgba(0,0,0,0)" />
    </svg>
  );
}

function earthquakeColor(colorIdx: any) {
  return rect(toHexStr(EARTHQUAKE_COLORS[colorIdx]));
}

function toHexStr(d: any) {
  const hex = Number(d).toString(16);
  return "#000000".substr(0, 7 - hex.length) + hex;
}

function rect(color: string, backgroundImgSrc?: string) {
  return <div className={css.rect} style={{ background: backgroundImgSrc ? `url('${backgroundImgSrc}')` : color }} />;
}
