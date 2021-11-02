import React from "react";
import { inject, observer } from "mobx-react";
import ProgressBar from "react-toolbox/lib/progress_bar";
import PlanetWizard from "./planet-wizard";
import ColorKey from "./color-key";
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

import "../../css/simulation.less";
import "../../css/react-toolbox-theme.less";

const APP_CLASS_NAME = "simulation";

interface IState {}

@inject("simulationStore")
@observer
export default class Simulation extends BaseComponent<IBaseProps, IState> {
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

  getPlateHue = (plateId?: number) => {
    const plate = plateId != null ? this.simulationStore.model.getPlate(plateId) : undefined;
    return plate?.hue;
  }

  handleAssign = (type: BoundaryType) => {
    this.simulationStore.setSelectedBoundaryType(type);
  }

  handleClose = () => {
    this.simulationStore.clearSelectedBoundary();
  }

  render() {
    const { planetWizard, modelState, savingModel, selectedBoundary } = this.simulationStore;
    return (
      <div className={APP_CLASS_NAME}>
        <SplashScreen />
        <TopBar />
        <PlanetView />
        { modelState === "loading" && this.getProgressSpinner("The model is being prepared") }
        { savingModel && this.getProgressSpinner("The model is being saved") }
        { config.benchmark && <Benchmark /> }
        <div className="bottom-container">
          <CrossSection />
          { !planetWizard && <BottomPanel /> }
        </div>
        <ColorKey />
        { planetWizard && <PlanetWizard /> }
        {
          selectedBoundary &&
          <BoundaryConfigDialog
            open={!!selectedBoundary} boundary={selectedBoundary} getPlateHue={this.getPlateHue}
            onAssign={this.handleAssign} onClose={this.handleClose}
          />
        }
      </div>
    );
  }
}
