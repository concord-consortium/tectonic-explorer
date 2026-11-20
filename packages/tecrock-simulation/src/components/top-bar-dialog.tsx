import React, { ReactNode, RefObject, useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import { useTheme } from "@mui/material/styles";
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
  const { zIndex } = useTheme();
  const navRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // An MUI modal opened over this one (the simulation's "Model Stopped" can open at any time) hides it with
  // aria-hidden; the trap then lets focus go, and Esc belongs to the dialog on top, wherever focus is.
  const isTopmost = useCallback(() => wrapperRef.current?.getAttribute("aria-hidden") !== "true", []);
  const handleEscKeyDown = (event: KeyboardEvent) => {
    const target = event.target as Node;
    if (isTopmost() && (target === document.body || wrapperRef.current?.contains(target))) {
      onClose();
    }
  };
  // Runs on every open, including a reopen while the closing dialog is still mounted. Focus returns by ref, not
  // FocusTrap's restore, because Safari does not focus a clicked button.
  useEffect(() => {
    const openerNode = opener.current;
    if (active) {
      (navRef.current?.lastElementChild as HTMLElement | null)?.focus();
      return () => openerNode?.focus();
    }
  }, [active, opener]);
  const cls = (key: string) => classNames(dialogTheme[key], theme[key]);
  return createPortal(
    // MUI's modal layer, so this dialog and the simulation's MUI dialogs stack in the order they opened.
    <div ref={wrapperRef} className={cls("wrapper")} style={{ zIndex: zIndex.modal }}>
      <Overlay active={active} onClick={onClose} onEscKeyDown={handleEscKeyDown} data-test="top-bar-dialog-overlay" />
      <FocusTrap open={active} disableRestoreFocus isEnabled={isTopmost}>
        <div data-react-toolbox="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
          className={classNames(cls("dialog"), css.dialog, cls("normal"), { [cls("active")]: active })}>
          <section className={cls("body")}>
            <h6 id={titleId} className={cls("title")}>{ title }</h6>
            { children }
          </section>
          <nav ref={navRef} className={cls("navigation")}>
            { actions.map(({ label, onClick }) =>
              <Button key={label} label={label} onClick={onClick} className={cls("button")} />) }
            <Button label="Close" onClick={onClose} className={classNames(cls("button"), css.close)} />
          </nav>
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
};

export const TopBarDialog = ActivableRenderer<IProps>()(TopBarDialogBase);
