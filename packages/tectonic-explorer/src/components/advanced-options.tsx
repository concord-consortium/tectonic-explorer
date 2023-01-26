import React from "react";
import { inject, observer } from "mobx-react";
import { Button } from "react-toolbox/lib/button";
import { Dialog } from "react-toolbox/lib/dialog";
import { List, ListItem, ListCheckbox } from "react-toolbox/lib/list";
import Slider from "react-toolbox/lib/slider";
import Dropdown from "react-toolbox/lib/dropdown";
import config from "../config";
import { BaseComponent, IBaseProps } from "./base";
import { log } from "../log";

import css from "./advanced-options.scss";

type Option = { label: string; value: string; };

const INTERACTION_OPTIONS: Option[] = [
  { value: "none", label: "Rotate Planet" },
  { value: "crossSection", label: "Draw Cross-section" },
  { value: "force", label: "Draw Force Vectors" },
  { value: "continentDrawing", label: "Draw Continents" },
  { value: "continentErasing", label: "Erase Continents" },
  { value: "markField", label: "Mark Field" },
  { value: "unmarkAllFields", label: "Remove Field Markers" },
  { value: "fieldInfo", label: "Log Field Data" }
];

interface IProps extends IBaseProps {}
interface IState {}

@inject("simulationStore")
@observer
export class AdvancedOptions extends BaseComponent<IProps, IState> {
  changeInteraction: (value: any) => void;
  changeTargetModelStepsPerSecond: (value: number) => void;
  toggleBoundaries: () => void;
  toggleEulerPoles: () => void;
  toggleForces: () => void;
  toggleLatLongLines: () => void;
  togglePlateLabels: () => void;
  toggleVelocities: () => void;
  toggleWireframe: () => void;
  toggleMetamorphism: () => void;
  toggleSediments: () => void;
  storedPlayState: boolean;

  constructor(props: any) {
    super(props);
    this.saveModel = this.saveModel.bind(this);
    this.hideSaveDialog = this.hideSaveDialog.bind(this);
    this.toggleMetamorphism = this.toggleOption.bind(this, "metamorphism");
    this.toggleSediments = this.toggleOption.bind(this, "sediments");
    this.toggleWireframe = this.toggleOption.bind(this, "wireframe");
    this.toggleVelocities = this.toggleOption.bind(this, "renderVelocities");
    this.toggleForces = this.toggleOption.bind(this, "renderForces");
    this.toggleBoundaries = this.toggleOption.bind(this, "renderBoundaries");
    this.toggleEulerPoles = this.toggleOption.bind(this, "renderEulerPoles");
    this.toggleLatLongLines = this.toggleOption.bind(this, "renderLatLongLines");
    this.togglePlateLabels = this.toggleOption.bind(this, "renderPlateLabels");
    this.changeInteraction = this.handleChange.bind(this, "interaction");
    this.changeTargetModelStepsPerSecond = this.handleChange.bind(this, "targetModelStepsPerSecond");
    this.storedPlayState = true;
  }

  get options() {
    return this.simulationStore as Record<string, any>;
  }

  get enabledWidgets() {
    return config.sidebar.reduce((res: Record<string, boolean>, name: string) => {
      res[name] = true;
      return res;
    }, {});
  }

  handleChange(name: any, value: any) {
    const { setOption } = this.simulationStore;
    if (name === "interaction" && value === "unmarkAllFields") {
      // Special case, trigger an action using pulldown menu.
      this.simulationStore.unmarkAllFields();
    } else {
      setOption(name, value);
    }

    if (name === "interaction") {
      log({ action: "InteractionUpdated", data: { value } });
    } else if (name === "timestep") {
      log({ action: "SimulationSpeedUpdated", data: { value } });
    }
  }

  toggleOption(name: any) {
    const { setOption } = this.simulationStore;
    const newValue = !this.options[name];
    setOption(name, newValue);
    log({ action: "AdvancedOptionToggled", data: { label: name, value: newValue } });
  }

  togglePlateVisibility(plateId: number, checked: boolean) {
    this.simulationStore.setPlateProps({ id: plateId, visible: checked });
  }

  getStoredModelText(modelId: any) {
    const link = window.location.href.split("?")[0] + "?modelId=" + modelId;
    return (
      <div>
        <p className={css.saveStateText}>
          Model code:<br />
          <textarea className={css.copyText} id="model-code" value={modelId} readOnly />
        </p>
        <p className={css.saveStateText}>
          Link to model:<br />
          <textarea className={css.copyText} id="model-link" value={link} readOnly />
        </p>
      </div>
    );
  }

  hideSaveDialog() {
    this.handleChange("playing", this.storedPlayState);
    this.handleChange("lastStoredModel", "");
  }

  copyText(textAreaId: string) {
    const textarea: HTMLTextAreaElement | null = document.querySelector("textarea#" + textAreaId);
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
    }
  }

  getSaveDialogActions() {
    return [
      { label: "Copy Code", onClick: this.copyText.bind(this, "model-code") },
      { label: "Copy Link", onClick: this.copyText.bind(this, "model-link") },
      { label: "Close", onClick: this.hideSaveDialog }
    ];
  }

  saveModel() {
    this.simulationStore.saveModel();
    this.storedPlayState = this.options.playing;
    this.handleChange("playing", false);
    log({ action: "ModelShared" });
  }

  render() {
    const { model: { plates } } = this.simulationStore;
    const options = this.options;
    const enabledWidgets: Record<string, boolean> = this.enabledWidgets;
    const checkboxTheme = { item: css.checkboxItem };
    return (
      <div className={css.sidebar}>
        <List>
          { enabledWidgets.timestep &&
            <ListItem ripple={false} itemContent={
              <div className="list-slider">
                <label>Model Speed</label>
                <Slider
                  theme={{ knob: css.sliderKnob }}
                  min={15} max={60} value={options.targetModelStepsPerSecond}
                  onChange={this.changeTargetModelStepsPerSecond}
                  step={1}
                  pinned={true}
                />
              </div>
            } />
          }
          { enabledWidgets.interactions &&
            <ListItem ripple={false} itemContent={<Dropdown className="wide-dropdown" label="Interaction" source={INTERACTION_OPTIONS} value={options.interaction} onChange={this.changeInteraction} />} /> }
          { !config.geode && enabledWidgets.metamorphism &&
            <ListCheckbox caption="Metamorphism" legend="Show metamorphism" data-test="toggle-metamorphism" checked={options.metamorphism} onChange={this.toggleMetamorphism} theme={checkboxTheme} /> }
          { !config.geode && enabledWidgets.sediments &&
            <ListCheckbox caption="Sediments" legend="Show sediments" data-test="toggle-sediments" checked={options.sediments} onChange={this.toggleSediments} theme={checkboxTheme} /> }
          { enabledWidgets.latLongLines &&
            <ListCheckbox caption="Latitude and Longitude Lines" legend="Geographic coordinate system" data-test="toggle-renderLatLongLines" checked={options.renderLatLongLines} onChange={this.toggleLatLongLines} theme={checkboxTheme} /> }
          { enabledWidgets.plateLabels &&
            <ListCheckbox caption="Plate Labels" legend="Show plate numbers" data-test="toggle-renderPlateLabels" checked={options.renderPlateLabels} onChange={this.togglePlateLabels} theme={checkboxTheme} /> }
          { enabledWidgets.velocityArrows &&
            <ListCheckbox caption="Velocity Arrows" legend="Show plate motion" data-test="toggle-renderVelocities" checked={options.renderVelocities} onChange={this.toggleVelocities} theme={checkboxTheme} /> }
          { enabledWidgets.forceArrows &&
            <ListCheckbox caption="Force Arrows" legend="Show forces acting on a plate" data-test="toggle-renderForces" checked={options.renderForces} onChange={this.toggleForces} theme={checkboxTheme} /> }
          { enabledWidgets.eulerPoles &&
            <ListCheckbox caption="Euler Poles" legend="Show axes of rotation" data-test="toggle-renderEulerPoles" checked={options.renderEulerPoles} onChange={this.toggleEulerPoles} theme={checkboxTheme} /> }
          { enabledWidgets.boundaries &&
            <ListCheckbox caption="Plate Boundaries" legend="Highlight plate boundaries" data-test="toggle-renderBoundaries" checked={options.renderBoundaries} onChange={this.toggleBoundaries} theme={checkboxTheme} /> }
          { enabledWidgets.wireframe &&
            <ListCheckbox caption="Wireframe" legend="See through the plate surface" data-test="toggle-wireframe" checked={options.wireframe} onChange={this.toggleWireframe} theme={checkboxTheme} /> }
          <div className={css.buttonContainer}>
            { enabledWidgets.save &&
              <Button icon="share" label="Share Model" ripple={false} onClick={this.saveModel} disabled={this.options.savingModel} theme={{ button: css.button }} /> }
          </div>
          {
            config.debug &&
            <div>
              <p className={css.categoryLabel}>Show / hide plates</p>
              {
                plates.map(p =>
                  <ListCheckbox key={p.id} caption={`Plate ${p.id}`} data-test="toggle-plate" checked={p.visible} theme={checkboxTheme} onChange={this.togglePlateVisibility.bind(this, p.id)} />
                )
              }
            </div>
          }
        </List>
        <Dialog actions={this.getSaveDialogActions()} active={!!options.lastStoredModel} onEscKeyDown={this.hideSaveDialog} onOverlayClick={this.hideSaveDialog} title="Model saved!" data-test="sidebar-dialog">
          { this.getStoredModelText(options.lastStoredModel) }
        </Dialog>
      </div>
    );
  }
}
