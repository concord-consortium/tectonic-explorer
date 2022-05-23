import React, { PureComponent } from "react";
import FontIcon from "react-toolbox/lib/font_icon";
import { Button } from "react-toolbox/lib/button";

import "../../css/react-toolbox-theme.less";

interface IProps {
  className?: string;
  label?: string;
  icon?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default class SmallButton extends PureComponent<IProps> {
  render() {
    const { className, label, icon, onClick, children } = this.props;
    return (
      <Button className={`small-button ${className}`} onClick={onClick}>
        <FontIcon value={icon} />
        <div className="label">{ label || children }</div>
      </Button>
    );
  }
}
