import React from "react";

import css from "../../css-modules/icon-highlight-button.less";

interface IProps {
  className?: string;
  label: React.ReactElement;
  active?: boolean;
  disabled?: boolean;
  style: React.CSSProperties; // passed through to <button>
  Icon: any;
  onClick?: () => void;
}

export const IconHighlightButton: React.FC<IProps> = (props) => {
  // otherProps: style, data-test, etc.
  const { className, label, active, disabled, Icon, onClick, ...otherProps } = props;
  return (
    <button className={`${css.iconButton} ${className} ${active ? "active" : ""}`}
      disabled={disabled} onClick={onClick} {...otherProps}>
      <Icon className={`${css.icon} ${disabled ? "disabled" : ""}`} />
      <div className={`${css.label} ${disabled ? "disabled" : ""}`}>
        { label }
      </div>
    </button>
  );
};
