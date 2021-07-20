import React, { PureComponent } from "react";
import Checkbox from "react-toolbox/lib/checkbox";
import { Button } from "react-toolbox/lib/button";
import Input from "react-toolbox/lib/input";
import Autocomplete from "react-toolbox/lib/autocomplete";
import Dropdown from "react-toolbox/lib/dropdown";
import config from "../config";
import { INTERACTION_LABELS } from "./interaction-selector";
import { STEPS_DATA } from "./planet-wizard";
import presets from "../presets";
import { COLORMAP_OPTIONS } from "./sidebar-menu";

import css from "../../css-modules/authoring.less";

function camelCaseToWords(name: any) {
  return name.replace(/([A-Z])/g, ` $1`).toLowerCase();
}

type Option = [string, string] | string;

type ValueLabel = { value: string; label: string };

// Options can be defined as string or [name, label] array.
const MAIN_OPTIONS: Option[] = [
  ["rockLayers", "show rock layers"],
  ["playing", "auto-start simulation"],
  ["crossSection3d", "cross-section 3D"],
  ["timeCounter", "show time counter"],
  ["selectableInteractions", "main view interaction buttons"]
];

const VIEW_OPTIONS: Option[] = [
  ["colormap", "Color scheme"],
  "earthquakes",
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

// Options that are defined manually or just shouldn't be displayed in "Advanced options" section.
const SKIPPED_OPTIONS: Option[] = ["authoring", "planetWizard", "planetWizardSteps", "sidebar", "preset", "modelId", "densityWordInPlanetWizard"];

// All the options manually defined in various sections.
const CUSTOM_OPTIONS: Option[] = [...MAIN_OPTIONS, ...VIEW_OPTIONS, ...SKIPPED_OPTIONS]
  .map(opt => typeof opt === "string" ? opt : opt[0]);

// All remaining options.
const OTHER_OPTIONS = Object.keys(config).filter(opt => CUSTOM_OPTIONS.indexOf(opt) === -1);

// Options that should use Dropdown component.
const DROPDOWN_OPTIONS: Record<string, ValueLabel[]> = {
  preset: Object.keys(presets).map(name => ({ value: name, label: name })),
  colormap: COLORMAP_OPTIONS,
  integration: [
    { value: "euler", label: "Euler" },
    { value: "verlet", label: "Verlet" },
    { value: "rk4", label: "RK4" }
  ]
};

// Options that should use Autocomplete component.
const AUTOCOMPLETE_OPTIONS: Record<string, any> = {
  sidebar: {
    "earthquakes": "Earthquakes",
    "volcanicEruptions": "Volcanic eruptions",
    "metamorphism": "Metamorphism",
    "interactions": "Interactions",
    "timestep": "Model speed",
    "colormap": "Color scheme",
    "latLongLines": "Lat long lines",
    "plateLabels": "Plate labels",
    "velocityArrows": "Velocity arrows",
    "forceArrows": "Force arrows",
    "eulerPoles": "Euler poles",
    "boundaries": "Plate boundaries",
    "wireframe": "Wireframe rendering",
    "save": "Save button"
  },
  selectableInteractions: INTERACTION_LABELS,
  // Map steps data to simple value:label object.
  planetWizardSteps: Object.keys(STEPS_DATA).reduce((res: Record<string, unknown>, name) => {
    res[name] = STEPS_DATA[name].info;
    return res;
  }, {})
};

type IState = Record<string, any>;
interface IProps {}

export default class Authoring extends PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      advancedOptions: false
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

  componentDidUpdate(prevProps: IProps, prevState: IState) {
    const { modelId, preset } = this.state;
    if (modelId && modelId !== prevState.modelId) {
      this.setState({ preset: "" });
    }
    if (preset && preset !== prevState.preset) {
      this.setState({ modelId: "" });
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
        value = `[${value.toString()}]`;
        configValue = `[${configValue.toString()}]`;
      }
      if (value !== configValue) {
        if (value === true) {
          url += `&${name}`;
        } else {
          url += `&${name}=${value}`;
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

  renderAutocomplete(name: any, label: any, options: any) {
    const setValues = (values: any) => {
      this.setState({ [name]: values });
    };
    return (
      <div key={`autocompl-${name}`}>
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
    );
  }

  renderConfig(options: any) {
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
      const value = this.state[name];
      if (typeof value === "boolean") {
        return this.renderCheckbox(name, label);
      }
      if (DROPDOWN_OPTIONS[name]) {
        return this.renderDropdown(name, label, DROPDOWN_OPTIONS[name]);
      }
      if (AUTOCOMPLETE_OPTIONS[name]) {
        return this.renderAutocomplete(name, label, AUTOCOMPLETE_OPTIONS[name]);
      }
      if (typeof value === "string" || typeof value === "number") {
        return this.renderTextInput(name, label);
      }
    });
  }

  render() {
    const { advancedOptions } = this.state;
    const finalUrl = this.finalUrl();
    return (
      <div className={css.authoring}>
        <h1>Customize planet wizard and simulation configuration</h1>
        <h3>Preloaded model (works with and without planet wizard)</h3>
        { this.renderDropdown("preset", "Preset name", DROPDOWN_OPTIONS.preset, css.inlineInput) }
        or
        { this.renderTextInput("modelId", "Saved model ID", css.inlineInput) }
        <h3>Planet wizard</h3>
        <div className={css.section}>
          { this.renderCheckbox("planetWizard", "enabled") }
          { this.renderCheckbox("densityWordInPlanetWizard", 'use "density" word in Planet Wizard') }
          { this.renderAutocomplete("planetWizardSteps", "choose planet wizard steps", AUTOCOMPLETE_OPTIONS.planetWizardSteps) }
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
          { this.renderAutocomplete("sidebar", "", AUTOCOMPLETE_OPTIONS.sidebar) }
        </div>
        <h3>Advanced options</h3>
        {
          !advancedOptions &&
          <Button icon="expand_more" label="show" onClick={this.toggleAdvancedOptions} />
        }
        {
          advancedOptions &&
          <div>
            <Button icon="expand_less" label="hide" onClick={this.toggleAdvancedOptions} />
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
