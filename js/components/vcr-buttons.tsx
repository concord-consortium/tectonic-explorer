import React from "react";
import PauseIcon from "../../images/pause-icon.svg";
import PlayIcon from "../../images/start-icon.svg";
import RestartIcon from "../../images/restart-icon.svg";
import StepBackIcon from "../../images/step-back-icon.svg";
import StepForwardIcon from "../../images/step-forward-icon.svg";

import "../../css/vcr-buttons.less";

interface IProps {
  label: string;
  disabled?: boolean;
  Icon: any;
  onClick?: () => void;
}

export const VCRButton: React.FC<IProps> = (props) => {
  const { label, disabled, Icon, onClick, ...otherProps } = props;
  return (
    <button className="vcr-button" onClick={onClick} disabled={disabled} {...otherProps}>
      <div className="vcr-button-highlight">
        <div className="vcr-button-back">
          <Icon className={`vcr-icon ${disabled ? "disabled" : ""}`} />
        </div>
      </div>
      <div className={`vcr-button-label ${disabled ? "disabled" : ""}`}>
        { label }
      </div>
    </button>
  );
};

interface IPlayPauseButtonProps {
  isPlaying: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
export const PlayPauseButton: React.FC<IPlayPauseButtonProps> = ({ isPlaying, ...otherProps }) => {
  return (
    isPlaying
      ? <VCRButton label="Pause" Icon={PauseIcon} {...otherProps} />
      : <VCRButton label="Start" Icon={PlayIcon} {...otherProps} />
  );
};

interface ISimpleButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

export const RestartButton: React.FC<ISimpleButtonProps> = (props: ISimpleButtonProps) => {
  return (
    <VCRButton label="Restart" Icon={RestartIcon} {...props} />
  );
};

export const StepBackButton: React.FC<ISimpleButtonProps> = (props: ISimpleButtonProps) => {
  return (
    <VCRButton label="– Step" Icon={StepBackIcon} {...props} />
  );
};

export const StepForwardButton: React.FC<ISimpleButtonProps> = (props: ISimpleButtonProps) => {
  return (
    <VCRButton label="+ Step" Icon={StepForwardIcon} {...props} />
  );
};
