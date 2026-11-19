import React, { ReactNode, RefObject, useEffect, useId } from "react";
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
  opener: RefObject<HTMLElement>;
  theme?: Record<string, string>;
  children: ReactNode;
}

// react-toolbox's Dialog markup and theme, plus the dialog role, a label tied to the title, focus on Close when the
// dialog opens, a focus trap, and focus returned to the opener when the dialog closes.
const TopBarDialogBase = ({ active, title, actions = [], onClose, opener, theme = {}, children }: IProps) => {
  const titleId = useId();
  // FocusTrap's own restore returns focus to whatever had it before the dialog, which after a click in Safari is the
  // page body, since Safari does not focus a clicked button. So the opener is focused by ref.
  useEffect(() => {
    const openerNode = opener.current;
    if (active) {
      return () => openerNode?.focus();
    }
  }, [active, opener]);
  const cls = (key: string) => classNames(dialogTheme[key], theme[key]);
  return createPortal(
    <div className={cls("wrapper")}>
      <Overlay active={active} onClick={onClose} onEscKeyDown={onClose} data-test="top-bar-dialog-overlay" />
      <FocusTrap open={active} disableRestoreFocus>
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
