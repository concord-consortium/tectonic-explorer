import React from "react";
import { inject, observer } from "mobx-react";
import { topoColor, hueAndElevationToRgb } from "../colors/topographic-colors";
import { EARTHQUAKE_COLORS } from "../plates-view/earthquake-helpers";
import FontIcon from "react-toolbox/lib/font_icon";
import { Button } from "react-toolbox/lib/button";
import { BaseComponent, IBaseProps } from "./base";
import { Rock, rockProps, ROCK_PROPERTIES } from "../plates-model/rock-properties";
import PlateStore from "../stores/plate-store";
import config, { Colormap } from "../config";
import { getRockColor, getRockPatternImgSrc } from "../colors/rock-colors";
import { RGBAFloatToCssColor } from "../colors/utils";
import { RockKey } from "./rock-key";

import css from "../../css-modules/color-key.less";

function renderTopoScale(canvas: any) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  const step = 0.01;
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = RGBAFloatToCssColor(topoColor(-1 + i * 1.5));
    ctx.fillRect(0, (1 - i) * height * 0.5 + height * 0.5, width, height * step);
  }
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = RGBAFloatToCssColor(topoColor(0.5 + i * 0.5));
    ctx.fillRect(0, (1 - i) * height * 0.5, width, height * step);
  }
}

function renderPlateScale(canvas: any, hue: any) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  const step = 0.005;
  for (let i = 0; i <= 1; i += step) {
    ctx.fillStyle = RGBAFloatToCssColor(hueAndElevationToRgb(hue, i));
    ctx.fillRect(0, (1 - i) * height, width, height * step);
  }
}

const KEY_TITLE: Record<Colormap, string> = {
  topo: "Elevation",
  plate: "Plate Density",
  age: "Crust Age",
  rock: "Rock Type"
};

interface IState {}

@inject("simulationStore")
@observer
export default class ColorKey extends BaseComponent<IBaseProps, IState> {
  plateCanvas: any;
  topoCanvas: any;

  constructor(props: any) {
    super(props);
    this.toggleKey = this.toggleKey.bind(this);
  }

  componentDidMount() {
    this.renderCanvases();
  }

  componentDidUpdate() {
    this.renderCanvases();
  }

  renderCanvases() {
    const { colormap, model, key } = this.simulationStore;
    if (key === true) {
      if (colormap === "topo") {
        renderTopoScale(this.topoCanvas);
      } else if (colormap === "plate" || colormap === "age") {
        model.plates.forEach((plate: PlateStore) => {
          renderPlateScale(this.plateCanvas[plate.id], plate.hue);
        });
      }
    }
  }

  toggleKey() {
    const { setOption, key } = this.simulationStore;
    setOption("key", !key);
  }

  renderKeyButton() {
    return (
      <Button className={css.keyToggleButton} onClick={this.toggleKey} data-test="key-toggle-button">
        <FontIcon value="layers" />
        <span className={css.label}>Key</span>
      </Button>
    );
  }

  renderRockTypes(withPatterns: boolean) {
    return (
      (Object.keys(ROCK_PROPERTIES) as unknown[] as Rock[]).map((rock: Rock) => (
        <tr key={rock}>
          <td colSpan={2}>&nbsp;</td>
          <td>{ rect(getRockColor(rock), withPatterns && config.crossSectionPatterns ? getRockPatternImgSrc(rock) : undefined) }</td>
          <td className={css.crossSectionColor}>{ rockProps(rock).label }</td>
        </tr>
      ))
    );
  }

  renderKeyContent() {
    const { colormap, model, earthquakes, volcanicEruptions, crossSectionVisible, interaction } = this.simulationStore;
    const rockKeyVisible = crossSectionVisible || interaction === "takeRockSample";
    // hide the old key when showing the new rock key (temporary until tabbed UI is implemented)
    const colorKeyStyle = rockKeyVisible ? { display: "none" } : undefined;
    this.plateCanvas = {};
    return (
      <div className={css.colorKey} data-test="color-key">
        <FontIcon className={css.closeIcon} value="close" onClick={this.toggleKey} data-test="key-close-button" />
        <table className={css.keyTable}>
          <tbody className={css.colorKeyContainer} style={colorKeyStyle} data-test="color-key-plates">
            <tr>
              <th colSpan={4}>{ KEY_TITLE[colormap] }</th>
            </tr>
            {
              colormap === "rock" ?
                this.renderRockTypes(false) :
                <tr>
                  <td colSpan={2}>&nbsp;</td>
                  <td>
                    <div className={css.canvases + " " + css[colormap]}>
                      {
                        colormap === "topo" &&
                        <canvas ref={(c) => {
                          this.topoCanvas = c;
                        }} />
                      }
                      {
                        (colormap === "plate" || colormap === "age") && model.plates.map((plate: any) => <canvas key={plate.id} ref={(c) => {
                          this.plateCanvas[plate.id] = c;
                        }} />)
                      }
                    </div>
                  </td>
                  <td>
                    <div className={css.labels}>
                      { (colormap === "topo" || colormap === "plate") &&
                        <div>
                          <p style={{ marginTop: 0 }}>8000m</p>
                          <p style={{ marginTop: 20 }}>0m</p>
                          <p style={{ marginTop: 20 }}>-8000m</p>
                        </div> }
                      { colormap === "age" &&
                        <div>
                          <p style={{ marginTop: 0 }}>New Crust</p>
                          <p style={{ marginTop: 52 }}>Old Crust</p>
                        </div> }
                    </div>
                  </td>
                </tr>
            }
          </tbody>
          { volcanicEruptions &&
            <tbody className={css.volcanoKeyContainer} style={colorKeyStyle} data-test="color-key-volcanic-eruptions">
              <tr><th colSpan={4}>Volcanoes</th></tr>
              <tr>
                <td colSpan={2}>&nbsp;</td>
                <td><div className={css.volcanoMarker} /></td>
                <td><div className={css.volcanoLabel}>Volcanic Eruption</div></td>
              </tr>
            </tbody> }
          { earthquakes &&
            <tbody className={css.earthquakeKeyContainer} style={colorKeyStyle} data-test="color-key-earthquakes">
              <tr>
                <th colSpan={4}>Earthquakes</th>
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
            </tbody> }
        </table>
        { rockKeyVisible && <RockKey /> }
      </div>
    );
  }

  render() {
    const { key } = this.simulationStore;
    return key ? this.renderKeyContent() : this.renderKeyButton();
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
