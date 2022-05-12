import React from "react";
import { inject, observer } from "mobx-react";
import { CrustAgeKey } from "./crust-age-key";
import { PlateColorKey } from "./plate-color-key";
import { topoColor } from "../../colors/topographic-colors";
import { BaseComponent, IBaseProps } from "../base";
import { Colormap } from "../../config";
import { RGBAFloatToCssColor } from "../../colors/utils";

import css from "../../../css-modules/keys/map-type.less";

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

const KEY_TITLE: Partial<Record<Colormap, string>> = {
  topo: "Elevation"
};

interface IState {}

@inject("simulationStore")
@observer
export class MapType extends BaseComponent<IBaseProps, IState> {
  plateCanvas: any;
  topoCanvas: any;

  componentDidMount() {
    this.renderCanvases();
  }

  componentDidUpdate() {
    this.renderCanvases();
  }

  renderCanvases() {
    const { colormap, key } = this.simulationStore;
    if (key === true) {
      if (colormap === "topo") {
        renderTopoScale(this.topoCanvas);
      }
    }
  }

  render() {
    const { colormap, model } = this.simulationStore;
    this.plateCanvas = {};

    switch (colormap) {
    case "age": return <CrustAgeKey/>;
    case "plate": return <PlateColorKey model={model} />;
    }

    if (!KEY_TITLE[colormap]) {
      // For example, rock key won't be displayed as it's handled by a separate component.
      return null;
    }

    return (
      <div className={css.mapType} data-test="map-type-key">
        <table className={css.keyTable}>
          <tbody className={css.colorKeyContainer} data-test="map-type-key-plates">
            <tr>
              <th colSpan={4}>Key: { KEY_TITLE[colormap] }</th>
            </tr>
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
                </div>
              </td>
              <td>
                <div className={css.labels}>
                  { (colormap === "topo") &&
                    <div>
                      <p style={{ marginTop: 0 }}>8000m</p>
                      <p style={{ marginTop: 20 }}>0m</p>
                      <p style={{ marginTop: 20 }}>-8000m</p>
                    </div> }
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
