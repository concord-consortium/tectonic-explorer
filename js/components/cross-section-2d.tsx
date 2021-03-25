import React from "react";
import { autorun } from "mobx";
import { inject, observer } from "mobx-react";
import renderCrossSection from "../plates-view/render-cross-section";
import { BaseComponent, IBaseProps } from "./base";

import "../../css/cross-section-2d.less";

interface IState { }

@inject("simulationStore")
@observer
export default class CrossSection2D extends BaseComponent<IBaseProps, IState> {
  canvas: any;
  disposeObserver: any;

  componentDidMount() {
    this.disposeObserver = autorun(() => {
      const store = this.simulationStore;
      renderCrossSection(this.canvas, store.crossSectionOutput.dataFront, { rockLayers: store.crossSectionRockLayers });
    });
  }

  componentWillUnmount() {
    this.disposeObserver();
  }

  render() {
    const swapped = this.simulationStore.crossSectionSwapped;
    return (
      <div className="cross-section-2d-view" data-test="2D-view">
        <div className="canvas-container" data-test="canvas">
          <canvas ref={(c) => this.canvas = c} />
          <span className="left-label" data-test="2D-left-label">{ swapped ? "P2" : "P1" }</span>
          <span className="right-label" data-test="2D-right-label">{ swapped ? "P1" : "P2" }</span>
        </div>
      </div>
    );
  }
}
