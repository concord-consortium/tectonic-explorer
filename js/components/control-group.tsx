import classNames from "classnames";
import React from "react";

import "../../css/control-group.less";

interface IProps {
  className?: string;
  first?: boolean;
  last?: boolean;
  disabled?: boolean;
}

export const ControlGroup: React.FC<IProps> = (props) => {
  const { className, first, last, children, disabled } = props;
  return (
    <div className={classNames("control-group", className, { disabled })}>
      <div className={classNames("border-bubble", { first }, { last })} />
      { children }
    </div>
  );
};
