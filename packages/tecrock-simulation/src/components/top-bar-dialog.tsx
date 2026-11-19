import React, { ReactNode, useId } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import ActivableRenderer from "react-toolbox/lib/hoc/ActivableRenderer";
import { Overlay } from "react-toolbox/lib/overlay";
import { Button } from "react-toolbox/lib/button";
import dialogTheme from "react-toolbox/lib/dialog/theme.css";
import css from "./top-bar-dialog.scss";

interface ITopBarDialogAction {
  label: string;
  onClick: () => void;
}

interface IProps {
  active: boolean;
  title: string;
  actions?: ITopBarDialogAction[];
  onClose: () => void;
  theme?: Record<string, string>;
  children: ReactNode;
}

// react-toolbox's Dialog markup and theme, plus the dialog role, a label tied to the title, focus on Close when the
// dialog opens, and a focus trap that returns focus to the opener when the dialog closes.
const TopBarDialogBase = ({ active, title, actions = [], onClose, theme = {}, children }: IProps) => {
  const titleId = useId();
  const cls = (key: string) => classNames(dialogTheme[key], theme[key]);
  return createPortal(
    <div className={cls("wrapper")}>
      <Overlay active={active} onClick={onClose} onEscKeyDown={onClose} data-test="top-bar-dialog-overlay" />
      <FocusTrap open={active}>
        <div data-react-toolbox="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
          className={classNames(cls("dialog"), css.dialog, cls("normal"), { [cls("active")]: active })}>
          <section className={cls("body")}>
            <h6 id={titleId} className={cls("title")}>{ title }</h6>
            { children }
          </section>
          <nav className={cls("navigation")}>
            { actions.map(({ label, onClick }) =>
              <Button key={label} label={label} onClick={onClick} className={cls("button")} />) }
            <Button label="Close" onClick={onClose} className={classNames(cls("button"), css.close)} autoFocus />
          </nav>
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
};

export const TopBarDialog = ActivableRenderer<IProps>()(TopBarDialogBase);
