import clone from "lodash/clone";
import React, { PureComponent } from "react";
import Checkbox from "react-toolbox/lib/checkbox";
import { Button } from "react-toolbox/lib/button";
import Input from "react-toolbox/lib/input";
import Autocomplete from "react-toolbox/lib/autocomplete";
import Dropdown from "react-toolbox/lib/dropdown";
import { getAvailableColorMaps } from "../color-maps";
import config, { Colormap } from "../config";
import { INTERACTION_LABELS } from "./interaction-selector";
import { STEPS_DATA } from "./planet-wizard";
import presets from "../presets";

import css from "../../css-modules/authoring.less";

function camelCaseToWords(name: any) {
  return name.replace(/([A-Z])/g, ` $1`).toLowerCase();
}

type Option = [string, string] | string;

type ValueLabel = { value: string; label: string };

// Options can be defined as string or [name, label] array.
const MAIN_OPTIONS: Option[] = [
  ["playing", "auto-start simulation"],
  ["timeCounter", "show time counter"],
  ["selectableInteractions", "main view interaction buttons (GEODE only)"]
];

const VIEW_OPTIONS: Option[] = [
  ["colormap", "default map type"],
  ["colormapOptions", "available map types"],
  ["tabs", "available tabs"],
  ["showDrawCrossSectionButton", "show Draw Cross-section button"],
  ["showTakeSampleButton", "show Take Sample button"],
  ["showTempPressureTool", "show Measure Temp/Pressure button"],
  ["showEarthquakesSwitch", "show Earthquakes switch"],
  "earthquakes",
  ["showVolcanoesSwitch", "show Volcanoes switch"],
  "volcanicEruptions",
  "metamorphism",
  "renderVelocities",
  "renderLatLongLines",
  "renderPlateLabels",
  "renderBoundaries",
  "renderEulerPoles",
  "renderForces",
  "wireframe"
];

// Options that need not be authored or specified in the url for geode
const TECROCKS_ONLY_OPTIONS = ["cameraLockedInPlanetWizard", "metamorphism", "showTakeSampleButton"];

// Options that are defined manually or just shouldn't be displayed in "Advanced options" section.
const SKIPPED_OPTIONS: Option[] = ["authoring", "geode", "planetWizard", "planetWizardSteps",
  "sidebar", "preset", "modelId", "densityWordInPlanetWizard", "cameraLockedInPlanetWizard"];

// All the options manually defined in various sections.
const CUSTOM_OPTIONS: Option[] = [...MAIN_OPTIONS, ...VIEW_OPTIONS, ...SKIPPED_OPTIONS]
  .map(opt => typeof opt === "string" ? opt : opt[0]);

// All remaining options.
const OTHER_OPTIONS = Object.keys(config).filter(opt => CUSTOM_OPTIONS.indexOf(opt) === -1);

// Options that should use Dropdown component.
const DROPDOWN_OPTIONS: Record<string, ValueLabel[]> = {
  preset: Object.keys(presets).map(name => ({ value: name, label: name })),
  colormap: getAvailableColorMaps(config),
  integration: [
    { value: "euler", label: "Euler" },
    { value: "verlet", label: "Verlet" },
    { value: "rk4", label: "RK4" }
  ]
};

function getPlanetWizardSteps(geode: boolean) {
  return Object.keys(STEPS_DATA).reduce((res: Record<string, unknown>, name) => {
    res[name] = STEPS_DATA[name].info(geode);
    return res;
  }, {});
}

function getColorMapOptions(_config: Record<string, any>) {
  return getAvailableColorMaps(_config)
    .reduce((result, entry) => {
      result[entry.value] = entry.label;
      return result;
    }, {} as Record<Colormap, string>);
}

// Options that should use Autocomplete component.
const AUTOCOMPLETE_OPTIONS: Record<string, any> = {
  sidebar: {
    "interactions": "Interactions",
    "metamorphism": "Metamorphism",
    "timestep": "Model speed",
    "latLongLines": "Lat long lines",
    "plateLabels": "Plate labels",
    "velocityArrows": "Velocity arrows",
    "forceArrows": "Force arrows",
    "eulerPoles": "Euler poles",
    "boundaries": "Plate boundaries",
    "wireframe": "Wireframe rendering",
    "save": "Save button"
  },
  tabs: {
    "map-type": "Map Type",
    "seismic-data": "Seismic Data",
    "options": "Options",
  },
  selectableInteractions: INTERACTION_LABELS,
  // Map steps data to simple value:label object.
  planetWizardSteps: getPlanetWizardSteps(config.geode),
  colormapOptions: getColorMapOptions(config)
};

type IState = Record<string, any>;
interface IProps {}

export default class Authoring extends PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      advancedOptions: false,
      autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
      dropDownOptions: DROPDOWN_OPTIONS
    };
    Object.keys(config).forEach(name => {
      let value = config[name];
      if (name === "startTime" || name === "endTime") {
        value = (new Date(value as string)).toISOString();
      }
      (this.state as any)[name] = value;
    });
    this.toggleAdvancedOptions = this.toggleAdvancedOptions.bind(this);
  }

  updatePlanetWizardSteps(geode: boolean) {
    const planetWizardSteps = getPlanetWizardSteps(geode);
    this.setState(state => ({ autoCompleteOptions: { ...state.autoCompleteOptions, planetWizardSteps } }));
  }

  updateColorMapOptions(_config: Record<string, any>, geodeDidChange?: boolean) {
    const availableColorMaps = getAvailableColorMaps(_config);
    // default colormap options should be limited to allowed options
    this.setState(state => ({ dropDownOptions: { ...state.dropDownOptions, colormap: availableColorMaps } }));
    // if the currently selected default color map isn't available, default to first available (usually topographic)
    if (!availableColorMaps.find(item => item.value === _config.colormap)) {
      this.setState({ colormap: availableColorMaps[0].value });
    }
    // filter the currently specified set of options through the set of available options
    const newOptions = geodeDidChange && !_config.geode
                        ? config.colormapOptions  // reset to global defaults when switching from geode => TecRocks
                        : _config.colormapOptions
                          .filter((option: Colormap) => availableColorMaps.find(item => item.value === option));
    // if all options have been eliminated, default to topographic
    if (newOptions.length === 0) {
      newOptions.push("topo");
    }
    if (_config.colormapOptions.join("") !== newOptions.join("")) {
      this.setState({ colormapOptions: newOptions });
    }
    // autocomplete lets user bring allowable options back after clearing them
    const colormapOptions = getColorMapOptions({ geode: _config.geode });
    this.setState(state => ({ autoCompleteOptions: { ...state.autoCompleteOptions, colormapOptions } }));
  }

  updateSidebar() {
    const sidebarOptions = clone(AUTOCOMPLETE_OPTIONS.sidebar);
    if (this.state.geode) {
      delete sidebarOptions.metamorphism;
      this.setState(state => ({ sidebar: state.sidebar.filter((v: string) => v !== "metamorphism") }));
    } else {
      if (this.state.sidebar.indexOf("metamorphism")) {
        this.setState(state => ({ sidebar: state.sidebar.concat("metamorphism") }));
      }
    }
    this.setState(state => ({ autoCompleteOptions: { ...state.autoCompleteOptions, sidebar: sidebarOptions } }));
  }

  componentDidUpdate(prevProps: IProps, prevState: IState) {
    const { geode, modelId, preset, colormapOptions } = this.state;
    let geodeDidChange = false;
    let shouldUpdatePlanetWizardSteps = false;
    let shouldUpdateColorMapOptions = false;
    let shouldUpdateSidebarOptions = false;

    if (modelId && modelId !== prevState.modelId) {
      this.setState({ preset: "" });
    }
    if (preset && preset !== prevState.preset) {
      this.setState({ modelId: "" });
    }
    if ((geode != null) && (geode !== prevState.geode)) {
      geodeDidChange = true;
      shouldUpdatePlanetWizardSteps = true;
      shouldUpdateColorMapOptions = true;
      shouldUpdateSidebarOptions = true;
    }
    if ((colormapOptions != null) && (colormapOptions.join("") !== prevState.colormapOptions.join(""))) {
      shouldUpdateColorMapOptions = true;
    }
    if (shouldUpdatePlanetWizardSteps || shouldUpdateColorMapOptions || shouldUpdateSidebarOptions) {
      shouldUpdatePlanetWizardSteps && this.updatePlanetWizardSteps(geode);
      shouldUpdateColorMapOptions && this.updateColorMapOptions(this.state, geodeDidChange);
      shouldUpdateSidebarOptions && this.updateSidebar();
    }
  }

  finalUrl() {
    let url = window.location.href.slice();
    url = url.replace("?authoring", "");

    Object.keys(config).forEach(name => {
      let value = this.state[name];
      let configValue = config[name];
      if (name === "startTime" || name === "endTime") {
        configValue = (new Date(configValue)).toISOString();
      }
      if (value?.constructor === Array) {
        value = `[${value.slice().sort().toString()}]`;
        const customOptions = this.state.autoCompleteOptions[name];
        if (customOptions) {
          configValue = configValue.filter((v: string) => !!customOptions[v]);
        }
        configValue = `[${configValue.sort().toString()}]`;
      }
      // don't include TecRocks-only options in geode urls
      if (!(this.state.geode && TECROCKS_ONLY_OPTIONS.includes(name))) {
        // only include values that are different than the defaults in the url
        if (value !== configValue || name === "geode") { // always include "geode" (skip mode selector)
          if (value === true) {
            url += `&${name}`;
          } else {
            url += `&${name}=${value}`;
          }
        }
      }
    });
    // Remove first &, as it's unnecessary and make sure there's ?
    url = url.replace("&", "?");
    return url;
  }

  toggleAdvancedOptions() {
    const { advancedOptions } = this.state;
    this.setState({ advancedOptions: !advancedOptions });
  }

  renderCheckbox(name: any, label: any) {
    const toggleOption = () => {
      this.setState((prevState: any) => ({
        [name]: !prevState[name]
      }));
    };
    return (
      <Checkbox key={`checkbox-${name}`} theme={css} checked={this.state[name]} onChange={toggleOption} label={label} />
    );
  }

  renderTextInput(name: any, label: any, className?: string) {
    const setOption = (value: any) => {
      this.setState({ [name]: value });
    };
    return (
      <Input key={`input-${name}`} theme={css} className={className} label={label}
        type="text" value={this.state[name]} onChange={setOption} />
    );
  }

  renderDropdown(name: any, label: any, options: any, className?: string) {
    const setOption = (value: any) => {
      this.setState({ [name]: value });
    };
    return (
      <Dropdown
        className={className}
        key={`dropdown-${name}`}
        auto
        theme={css}
        label={label}
        onChange={setOption}
        source={options}
        value={this.state[name]}
      />
    );
  }

  renderAutocomplete(name: any, label: any) {
    const setValues = (values: any) => {
      this.setState({ [name]: values });
    };
    const options = this.state.autoCompleteOptions[name];
    return (
      <div key={`autocompl-${name}`}>
        <div className={css.autocompleteContainer}>
          <div className={css.autocompleteLabel}>{ label }</div>
          <Autocomplete
            theme={css}
            direction="down"
            onChange={setValues}
            label={"Choose options"}
            source={options}
            value={this.state[name]}
          />
        </div>
      </div>
    );
  }

  renderConfig(options: any) {
    const { dropDownOptions, autoCompleteOptions } = this.state;
    return options.map((option: any) => {
      let name;
      let label;
      if (typeof option === "string") {
        name = option;
        label = camelCaseToWords(name);
      } else {
        name = option[0];
        label = option[1];
      }
      if (this.state.geode && TECROCKS_ONLY_OPTIONS.includes(name)) {
        return null;
      }
      const value = this.state[name];
      if (typeof value === "boolean") {
        return this.renderCheckbox(name, label);
      }
      if (dropDownOptions[name]) {
        return this.renderDropdown(name, label, dropDownOptions[name]);
      }
      if (autoCompleteOptions[name]) {
        return this.renderAutocomplete(name, label);
      }
      if (typeof value === "string" || typeof value === "number") {
        return this.renderTextInput(name, label);
      }
    });
  }

  render() {
    const { geode, advancedOptions, dropDownOptions } = this.state;
    const finalUrl = this.finalUrl();
    return (
      <div className={css.authoring}>
        <h1>Customize planet wizard and simulation configuration</h1>
        <h3>Preloaded model (works with and without planet wizard)</h3>
        { this.renderDropdown("preset", "Preset name", dropDownOptions.preset, css.inlineInput) }
        or
        { this.renderTextInput("modelId", "Saved model ID", css.inlineInput) }
        { !config.geode && // can't remove it via authoring if it's already in the url
          <>
            <h3>Geode/TecRocks</h3>
            <div className={css.section}>
              { this.renderCheckbox("geode", "Geode (TecRocks when unchecked)") }
            </div>
          </> }
        <h3>Planet wizard</h3>
        <div className={css.section}>
          { this.renderCheckbox("planetWizard", "enabled") }
          { this.renderCheckbox("densityWordInPlanetWizard", 'use "density" word in Planet Wizard') }
          { !geode && this.renderCheckbox("cameraLockedInPlanetWizard", "lock camera in Boundary Type and Density steps in Planet Wizard") }
          { this.renderAutocomplete("planetWizardSteps", "choose planet wizard steps") }
        </div>
        <h3>Main options</h3>
        <div className={css.section}>
          { this.renderConfig(MAIN_OPTIONS) }
        </div>
        <h3>View options</h3>
        <div className={css.section}>
          { this.renderConfig(VIEW_OPTIONS) }
        </div>
        <h3>Sidebar menu options</h3>
        <div className={css.section}>
          { this.renderAutocomplete("sidebar", "") }
        </div>
        <h3>Advanced options</h3>
        {
          !advancedOptions &&
          <Button icon="expand_more" label="show" ripple={false} onClick={this.toggleAdvancedOptions} />
        }
        {
          advancedOptions &&
          <div>
            <Button icon="expand_less" label="hide" ripple={false} onClick={this.toggleAdvancedOptions} />
            <div className={css.section}>
              { this.renderConfig(OTHER_OPTIONS) }
            </div>
          </div>
        }
        <h3>Final URL</h3>
        <div className={css.finalUrl}><a href={finalUrl} target="_blank" rel="noreferrer">{ finalUrl }</a></div>
      </div>
    );
  }
}
