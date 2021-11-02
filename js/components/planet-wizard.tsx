import React from "react";
import { inject, observer } from "mobx-react";
import { Button } from "react-toolbox/lib/button";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import presets from "../presets";
import { SimulationStore } from "../stores/simulation-store";
import ccLogo from "../../images/cc-logo.png";
import ccLogoSmall from "../../images/cc-logo-small.png";
import SortableDensities from "./sortable-densities";
import { BaseComponent, IBaseProps } from "./base";

import "../../css/planet-wizard.less";

const AVAILABLE_PRESETS = [
  { name: "plates2", label: "2 Plates" },
  { name: "plates3", label: "3 Plates" },
  { name: "plates4", label: "4 Plates" },
  { name: "plates5", label: "5 Plates" },
  { name: "plates5Uneven", label: "5 Plates", info: "Uneven Distribution" }
];

interface IStepsData {
  info: string; // label of bottom bar button
  navigationDisabled?: boolean; // whether next/back navigation should be disabled globally
  nextDisabled?: (simulationStore: SimulationStore) => boolean; // whether next navigation should be disabled conditionally
}
export const STEPS_DATA: Record<string, IStepsData> = {
  presets: {
    info: "Select layout of the planet",
    navigationDisabled: true
  },
  continents: {
    info: "Draw continents"
  },
  forces: {
    info: "Assign boundary types",
    nextDisabled: simulationStore => !simulationStore.model.plates.some(plate => plate.hasHotSpot)
  },
  densities: {
    info: "Order plates"
  }
};

// When there's preset or modelId provided, make sure that preset selection step isn't used.
// It's for authors convenience, so it's not necessary to modify default list of planet wizard steps
// when preloaded model is used in wizard.
const STEPS = config.preset || config.modelId
  ? config.planetWizardSteps.filter((stepName: string) => stepName !== "presets") : config.planetWizardSteps;

interface IState {
  step: number;
}

@inject("simulationStore")
@observer
export default class PlanetWizard extends BaseComponent<IBaseProps, IState> {
  constructor(props: IBaseProps) {
    super(props);
    this.state = {
      step: 0
    };
    this.handleNextButtonClick = this.handleNextButtonClick.bind(this);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    this.saveModel = this.saveModel.bind(this);
  }

  get currentStep() {
    const { step } = this.state;
    return STEPS[step];
  }

  get nextButtonLabel() {
    const { step } = this.state;
    return step === STEPS.length - 1 ? "Finish" : "Next";
  }

  get navigationDisabled() {
    return STEPS_DATA[this.currentStep].navigationDisabled;
  }

  get nextButtonDisabled() {
    // trigger rerender when hotSpots change
    // TODO: figure out better triggering mechanism, e.g. making hotSpots observable
    this.simulationStore.hotSpotChanges; // eslint-disable-line no-unused-expressions
    return STEPS_DATA[this.currentStep].nextDisabled?.(this.simulationStore);
  }

  componentDidMount() {
    const { setOption } = this.simulationStore;
    setOption("playing", false);
    setOption("interaction", "none");
    setOption("renderBoundaries", true);
    setOption("renderForces", true);
    this.setupStepOptions();
    this.saveModel();
  }

  componentDidUpdate(prevProps: IBaseProps, prevState: IState) {
    const { step } = this.state;
    if (step !== prevState.step) {
      this.setupStepOptions();
      if (step > prevState.step) {
        this.saveModel();
      } else {
        this.restoreModel();
      }
    }
  }

  setupStepOptions() {
    const stepName = this.currentStep;
    if (stepName === "presets") {
      this.unloadModel();
    } else if (stepName === "continents") {
      this.setContinentsStep();
    } else if (stepName === "forces") {
      this.setForcesStep();
    } else if (stepName === "densities") {
      this.setDensitiesStep();
    } else if (stepName === undefined) {
      this.endPlanetWizard();
    }
  }

  handleNextButtonClick() {
    const { step } = this.state;
    this.setState({ step: step + 1 });
  }

  handleBackButtonClick() {
    const { step } = this.state;
    if (step > 0) {
      this.setState({ step: step - 1 });
    }
  }

  saveModel() {
    const { takeLabeledSnapshot } = this.simulationStore;
    if (this.currentStep !== "presets") {
      takeLabeledSnapshot(this.currentStep);
    }
  }

  restoreModel() {
    const { restoreLabeledSnapshot } = this.simulationStore;
    if (this.currentStep !== "presets") {
      restoreLabeledSnapshot(this.currentStep);
    }
  }

  loadModel(presetInfo: any) {
    const { loadPresetModel } = this.simulationStore;
    loadPresetModel(presetInfo.name);
    this.handleNextButtonClick();
  }

  unloadModel() {
    const { unloadModel, setOption } = this.simulationStore;
    unloadModel();
    setOption("interaction", "none");
    setOption("selectableInteractions", []);
    setOption("colormap", "topo");
  }

  setContinentsStep() {
    const { setOption } = this.simulationStore;
    setOption("interaction", "continentDrawing");
    setOption("selectableInteractions", ["continentDrawing", "continentErasing", "none"]);
    setOption("colormap", "topo");
  }

  setForcesStep() {
    const { setOption } = this.simulationStore;
    setOption("interaction", "assignBoundary");
    setOption("selectableInteractions", ["assignBoundary"]);
    setOption("colormap", "topo");
  }

  setDensitiesStep() {
    const { setOption } = this.simulationStore;
    setOption("interaction", "none");
    setOption("selectableInteractions", []);
    setOption("colormap", "plate");
  }

  endPlanetWizard() {
    const { setOption } = this.simulationStore;
    setOption("planetWizard", false);
    setOption("playing", true);
    setOption("interaction", "none");
    setOption("colormap", config.colormap);
    setOption("renderBoundaries", config.renderBoundaries);
    setOption("renderForces", config.renderForces);
    setOption("selectableInteractions", config.selectableInteractions);
  }

  renderPreset(presetInfo: any) {
    const preset = presets[presetInfo.name];
    const clickHandler = this.loadModel.bind(this, presetInfo);
    return (
      <Button className="preset-button" key={presetInfo.name} onClick={clickHandler}>
        <div>
          <img src={preset.img} />
          <div className="label">
            { presetInfo.label }
            { presetInfo.info && <p className="additional-info">{ presetInfo.info }</p> }
          </div>
        </div>
      </Button>);
  }

  renderStep(idx: any) {
    const { step } = this.state;
    const done = idx < step;
    const doneClass = done ? "done" : "";
    const activeClass = idx === step ? "active" : "";
    return (<span className={`circle ${activeClass} ${doneClass}`} key={"step" + idx}>{ done ? <FontIcon className="check-mark" value="check" /> : (idx + 1) }</span>);
  }

  renderInfo(idx: any, info: any) {
    const { step } = this.state;
    const done = idx < step;
    const doneClass = done ? "done" : "";
    const activeClass = idx === step ? "active" : "";
    return (<span className={`label ${activeClass} ${doneClass}`} key={"info" + idx}>{ info }</span>);
  }

  render() {
    const { step } = this.state;
    const stepName = this.currentStep;
    if (stepName === undefined) {
      return null;
    }
    const backDisabled = this.navigationDisabled || step === 0;
    const nextDisabled = this.navigationDisabled || this.nextButtonDisabled;
    return (
      <div className="planet-wizard">
        {
          stepName === "presets" &&
          <div className="planet-wizard-overlay step-plates" data-test="plate-num-options">
            { AVAILABLE_PRESETS.map(preset => this.renderPreset(preset)) }
          </div>
        }
        {
          stepName === "densities" &&
          <div className="planet-wizard-overlay step-densities" data-test="plate-density-options">
            <SortableDensities />
          </div>
        }
        <div className="planet-wizard-bottom-panel">
          <img src={ccLogo} className="cc-logo-large" data-test="cc-logo-large" />
          <img src={ccLogoSmall} className="cc-logo-small" data-test="cc-logo-small" />
          {
            STEPS.map((stName: string, idx: number) =>
              <span className="step" key={idx} data-test={"step" + idx}>
                { this.renderStep(idx) }
                { this.renderInfo(idx, STEPS_DATA[stName].info) }
                <div className="divider" />
              </span>)
          }
          <Button primary raised label={"Back"} disabled={backDisabled} onClick={this.handleBackButtonClick} />
          <Button primary raised label={this.nextButtonLabel} disabled={nextDisabled} onClick={this.handleNextButtonClick} data-test="planet-wizard-next" />
        </div>
      </div>
    );
  }
}
