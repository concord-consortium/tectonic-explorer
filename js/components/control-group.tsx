import classNames from "classnames";
import React from "react";

import "../../css/control-group.less";

interface IProps {
  className?: string;
  hideBubble?: boolean;
  first?: boolean;
  last?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ControlGroup: React.FC<IProps> = (props) => {
  const { className, hideBubble = false, first, last, children, disabled } = props;
  return (
    <div className={classNames("control-group", className, { hideBubble, disabled })}>
      <div className={classNames("border-bubble", { hideBubble, first, last })} />
      { children }
    </div>
  );
};
