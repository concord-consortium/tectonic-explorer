import React from "react";
import { Button } from "react-toolbox/lib/button";
import EarthImage from "../../images/earth@3x.png";

import modeWizardTheme from "../../css-modules/mode-wizard-theme.scss";
import "../../css/mode-wizard.scss";

interface IModeConfig {
  testId: string;
  title: string;
  features: string[];
}

const geode: IModeConfig = {
  testId: "Geode",
  title: "Plate Tectonics",
  features: [
    "Plate tectonics",
    "Cross-section view"
  ]
};
const tecrocks: IModeConfig = {
  testId: "TecRocks",
  title: "Plate Tectonics Plus\xa0Rock\xa0Formation",
  features: [
    ...geode.features,
    "Rock types",
    "Rock sampler tool",
    "Temperature and \xa0\xa0\xa0pressure tool"
  ]
};

interface IProps {
  onSetRocksMode: (geode: boolean) => void;
}
export const ModeWizard = ({ onSetRocksMode }: IProps) => {
  return (
    <div className="mode-wizard">
      <div className="mode-wizard-prompt">Choose the Tectonic Explorer version you would like to use:</div>
      <div className="mode-wizard-options">
        <ModeWizardOption config={geode} onClick={() => onSetRocksMode(false)} />
        <div className="mode-option-divider"/>
        <ModeWizardOption config={tecrocks} onClick={() => onSetRocksMode(true)}/>
      </div>
    </div>
  );
};

interface IOptionProps {
  config: IModeConfig;
  onClick: () => void;
}
export const ModeWizardOption = ({ config: { testId, title, features }, onClick }: IOptionProps) => {
  return (
    <div className="mode-wizard-option">
      <Button primary raised label={title} data-test={`${testId}-button`} onClick={onClick} theme={modeWizardTheme} />
      <div className="mode-option-features">
        <img className="earth-image" src={EarthImage} />
        <div className="mode-features-include">Features include:</div>
        <ul className="mode-features-list">
          { features.map(f => (
            <li className="mode-feature-item" key={f}>{ f }</li>
          )) }
        </ul>
      </div>
    </div>
  );
};
