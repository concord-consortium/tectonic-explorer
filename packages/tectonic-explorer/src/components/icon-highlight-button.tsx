import React from "react";

import css from "./icon-highlight-button.scss";

interface IProps {
  className?: string;
  label: React.ReactElement;
  active?: boolean;
  disabled?: boolean;
  style: React.CSSProperties; // passed through to <button>
  Icon: any;
  Icon2?: any;
  onClick?: () => void;
}

export const IconHighlightButton: React.FC<IProps> = (props) => {
  // otherProps: style, data-test, etc.
  const { className, label, active, disabled, Icon, Icon2, onClick, ...otherProps } = props;
  return (
    <button className={`${css.iconButton} ${className} ${active ? "active" : ""}`}
      disabled={disabled} onClick={onClick} {...otherProps}>
      <div className={css.icons}>
        <Icon className={`${css.icon} ${disabled ? "disabled" : ""}`} />
        { Icon2 && <Icon2 className={`${css.icon} ${css.second} ${disabled ? "disabled" : ""}`} /> }
      </div>
      <div className={`${css.label} ${disabled ? "disabled" : ""}`}>
        { label }
      </div>
    </button>
  );
};
