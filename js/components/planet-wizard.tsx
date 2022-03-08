import React from "react";
import { inject, observer } from "mobx-react";
import { Button } from "react-toolbox/lib/button";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import presets from "../presets";
import { IGlobeInteractionName } from "../plates-interactions/globe-interactions-manager";
import { SimulationStore } from "../stores/simulation-store";
import ccLogo from "../../images/cc-logo.png";
import ccLogoSmall from "../../images/cc-logo-small.png";
import SortableDensities from "./sortable-densities";
import { BaseComponent, IBaseProps } from "./base";
import { log } from "../log";
import { isDensityDefinedCorrectly } from "../stores/helpers/planet-wizard-model-validators";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import "../../css/planet-wizard.less";

const AVAILABLE_PRESETS = [
  { name: "plates2", label: "2 Plates" },
  { name: "plates3", label: "3 Plates" },
  { name: "plates4", label: "4 Plates" },
  { name: "plates5", label: "5 Plates" },
  { name: "plates5Uneven", label: "5 Plates", info: "Uneven Distribution" }
];

interface IStepsData {
  info: (geode: boolean) => string; // label of bottom bar button
  navigationDisabled?: boolean; // whether next/back navigation should be disabled globally
  nextDisabled?: (simulationStore: SimulationStore) => boolean; // whether next navigation should be disabled conditionally
  validation?: IValidation; // when defined, the test will be run before user can go to the next step
}

interface IValidation {
  // If this function returns false, user will see a warning dialog that lets him return and fix the configuration.
  test: (simulationStore: SimulationStore) => boolean;
  // Warning dialog message.
  message: string;
  // Label of the button that lets users go back and fix the model.
  goBackButton: string;
}

export const STEPS_DATA: Record<string, IStepsData> = {
  presets: {
    info: () => "Select layout of the planet",
    navigationDisabled: true
  },
  continents: {
    info: () => "Draw continents"
  },
  forces: {
    info: (geode: boolean) => geode
            ? "Assign forces to plates"
            : "Assign boundary types",
    nextDisabled: simulationStore => !simulationStore.anyHotSpotDefinedByUser
  },
  densities: {
    info: () => "Order plates",
    validation: {
      test: simulationStore => isDensityDefinedCorrectly(simulationStore.model),
      message: "Oceanic crust should go below continental crust at the boundary. Please reorder the plates to make this possible.",
      goBackButton: "Re-order plates"
    }
  }
};

// When there's preset or modelId provided, make sure that preset selection step isn't used.
// It's for authors convenience, so it's not necessary to modify default list of planet wizard steps
// when preloaded model is used in wizard.
const STEPS = config.preset || config.modelId
  ? config.planetWizardSteps.filter((stepName: string) => stepName !== "presets") : config.planetWizardSteps;

interface IProps extends IBaseProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

interface IState {
  step: number;
  validationDialogOpen: boolean;
}

@inject("simulationStore")
@observer
export default class PlanetWizard extends BaseComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      step: 0,
      validationDialogOpen: false
    };
    this.handleNextButtonClick = this.handleNextButtonClick.bind(this);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    this.closeDialogAndContinue = this.closeDialogAndContinue.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
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
    return STEPS_DATA[this.currentStep].nextDisabled?.(this.simulationStore);
  }

  componentDidMount() {
    const { setOption } = this.simulationStore;
    setOption("playing", false);
    setOption("interaction", "none");
    setOption("renderBoundaries", true);
    setOption("renderForces", true);
    setOption("colormap", "topo");
    this.setupStepOptions();
  }

  componentDidUpdate(prevProps: IBaseProps, prevState: IState) {
    const { step } = this.state;
    if (step !== prevState.step) {
      this.setupStepOptions();
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
    log({ action: "PlanetWizardNextButtonClicked" });
    const { step } = this.state;
    const validation = STEPS_DATA[this.currentStep].validation;
    if (validation && !validation.test(this.simulationStore)) {
      this.openValidationDialog();
      return;
    }
    this.setState({ step: step + 1 });
  }

  handleBackButtonClick() {
    const { step } = this.state;
    if (step > 0) {
      this.setState({ step: step - 1 });
    }
    log({ action: "PlanetWizardBackButtonClicked" });
  }

  openValidationDialog() {
    this.setState({ validationDialogOpen: true });
  }

  closeDialogAndContinue() {
    const { step } = this.state;
    this.setState({ validationDialogOpen: false, step: step + 1 });
    log({ action: "PlanetWizardFailedValidationContinueAnywayButtonClicked" });
  }

  closeDialog() {
    this.setState({ validationDialogOpen: false });
    log({ action: "PlanetWizardFailedValidationTryAgainButtonClicked" });
  }

  loadModel(presetInfo: any) {
    const { loadPresetModel } = this.simulationStore;
    loadPresetModel(presetInfo.name);
    this.handleNextButtonClick();

    log({ action: "PlanetWizardNumberOfPlatesSelected", data: { value: presetInfo.name } });
  }

  unloadModel() {
    const { unloadModel, setOption } = this.simulationStore;
    unloadModel();
    setOption("interaction", "none");
    setOption("selectableInteractions", []);
    setOption("colormap", "topo");
    this.simulationStore.setAnyHotSpotDefinedByUser(false);
    this.simulationStore.setPlanetCameraLocked(false);
  }

  setContinentsStep() {
    const { setOption } = this.simulationStore;
    setOption("interaction", "continentDrawing");
    setOption("selectableInteractions", ["continentDrawing", "continentErasing", "none"]);
    setOption("colormap", "topo");
    this.simulationStore.setPlanetCameraLocked(false);
  }

  setForcesStep() {
    const { setOption } = this.simulationStore;
    const forcesInteraction: IGlobeInteractionName = config.geode ? "force" : "assignBoundary";
    setOption("interaction", forcesInteraction);
    setOption("selectableInteractions", config.cameraLockedInPlanetWizard ? [] : [forcesInteraction, "none"]);
    setOption("colormap", "topo");
    if (config.cameraLockedInPlanetWizard) {
      this.simulationStore.resetPlanetCamera();
      this.simulationStore.setPlanetCameraLocked(true);
    } else {
      this.simulationStore.setPlanetCameraLocked(false);
    }
  }

  setDensitiesStep() {
    const { setOption } = this.simulationStore;
    setOption("interaction", "none");
    setOption("selectableInteractions", []);
    setOption("colormap", "plate");
    if (config.cameraLockedInPlanetWizard) {
      this.simulationStore.resetPlanetCamera();
      this.simulationStore.setPlanetCameraLocked(true);
    } else {
      this.simulationStore.setPlanetCameraLocked(false);
    }
  }

  endPlanetWizard() {
    const { setOption } = this.simulationStore;
    setOption("planetWizard", false);
    setOption("playing", config.playing);
    setOption("interaction", "none");
    setOption("colormap", config.colormap);
    setOption("renderBoundaries", config.renderBoundaries);
    setOption("renderForces", config.renderForces);
    setOption("selectableInteractions", config.selectableInteractions);
    this.simulationStore.setPlanetCameraLocked(false);
    // This should never happen. But there's 0.001% chances that the highlight could stay for some reason -
    // mouse move event lost, or a planet wizard step changed using a key shortcut (that we don't have yet).
    // This line will ensure that the boundary won't be highlighted in the running model.
    this.simulationStore.unhighlightBoundarySegment();
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

  renderValidationDialog() {
    const { validationDialogOpen } = this.state;
    const validation = STEPS_DATA[this.currentStep].validation;
    if (!validation) {
      return null;
    }

    return (
      <Dialog open={validationDialogOpen}>
        <DialogTitle>
          Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            { validation.message }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closeDialogAndContinue}>Continue anyway</Button>
          <Button onClick={this.closeDialog} autoFocus>{ validation.goBackButton }</Button>
        </DialogActions>
      </Dialog>
    );
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
      <div className="planet-wizard" ref={this.props.canvasRef}>
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
                { this.renderInfo(idx, STEPS_DATA[stName].info(config.geode)) }
                <div className="divider" />
              </span>)
          }
          <Button primary raised label={"Back"} disabled={backDisabled} onClick={this.handleBackButtonClick} />
          <Button primary raised label={this.nextButtonLabel} disabled={nextDisabled} onClick={this.handleNextButtonClick} data-test="planet-wizard-next" />

          { this.renderValidationDialog() }
        </div>
      </div>
    );
  }
}
