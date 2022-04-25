import React from "react";
import { inject, observer } from "mobx-react";
import ProgressBar from "react-toolbox/lib/progress_bar";
import PlanetWizard from "./planet-wizard";
import TopBar from "./top-bar";
import BottomPanel from "./bottom-panel";
import PlanetView from "./planet-view";
import BoundaryConfigDialog from "./boundary-config-dialog";
import CrossSection from "./cross-section";
import Benchmark from "./benchmark";
import SplashScreen from "./splash-screen";
import config from "../config";
import { enableShutterbug, disableShutterbug } from "../shutterbug-support";
import { BaseComponent, IBaseProps } from "./base";
import { BoundaryType } from "../types";
import { SideContainer } from "./side-container";
import { TempPressureOverlay } from "./temp-pressure-overlay";

import "../../css/simulation.less";
import "../../css/react-toolbox-theme.less";

const APP_CLASS_NAME = "simulation";

interface IState {}

@inject("simulationStore")
@observer
export default class Simulation extends BaseComponent<IBaseProps, IState> {
  private appRef = React.createRef<HTMLDivElement>();
  private canvasRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    enableShutterbug(APP_CLASS_NAME);
  }

  componentWillUnmount() {
    disableShutterbug();
  }

  getProgressSpinner(spinnerText: any) {
    return (
      <div className="spinner">
        <ProgressBar className="big-spinner" type="circular" mode="indeterminate" multicolor />
        <div>{ spinnerText }</div>
      </div>);
  }

  getDialogOffset() {
    const { selectedBoundary } = this.simulationStore;
    const { canvasClickPos } = selectedBoundary || {};
    const topBarHeight = 20;
    const dialogSize = { width: 250, height: 150 };
    const dialogOffset = { x: 150, y: -100 };
    if (canvasClickPos) {
      const bounds = this.canvasRef.current?.getBoundingClientRect();
      if (bounds) {
        // adjust offset based on position of boundary click
        dialogOffset.x += canvasClickPos.x - bounds.width / 2;
        dialogOffset.y += canvasClickPos.y - bounds.height / 2;
        // keep it in visible bounds
        dialogOffset.x = Math.min(dialogOffset.x, (bounds.width - dialogSize.width) / 2);
        dialogOffset.y = Math.max(dialogOffset.y, topBarHeight - (bounds.height - dialogSize.height) / 2);
      }
    }
    return dialogOffset;
  }

  getPlateHue = (plateId?: number) => {
    const plate = plateId != null ? this.simulationStore.model.getPlate(plateId) : undefined;
    return plate?.hue;
  };

  handleAssign = (type: BoundaryType) => {
    this.simulationStore.setSelectedBoundaryType(type);
  };

  handleClose = () => {
    this.simulationStore.clearSelectedBoundary();
  };

  render() {
    const { planetWizard, modelState, savingModel, selectedBoundary, interaction } = this.simulationStore;
    const isMeasuringTempPressure = interaction === "measureTempPressure";
    return (
      <div className={APP_CLASS_NAME} ref={this.appRef} >
        <SplashScreen />
        <TopBar />
        <PlanetView />
        { modelState === "loading" && this.getProgressSpinner("The model is being prepared") }
        { savingModel && this.getProgressSpinner("The model is being saved") }
        { config.benchmark && <Benchmark /> }
        <div className="cross-section-container">
          <CrossSection />
        </div>
        {
          isMeasuringTempPressure &&
          <TempPressureOverlay simulationStore={this.simulationStore} />
        }
        {
          planetWizard &&
          <PlanetWizard canvasRef={this.canvasRef} />
        }
        {
          !planetWizard &&
          <SideContainer />
        }
        {
          !planetWizard &&
          <div className="bottom-bar-container">
            <BottomPanel />
          </div>
        }
        {
          selectedBoundary &&
          <BoundaryConfigDialog
            boundary={selectedBoundary} offset={this.getDialogOffset()} getPlateHue={this.getPlateHue}
            onAssign={this.handleAssign} onClose={this.handleClose}
          />
        }
      </div>
    );
  }
}
