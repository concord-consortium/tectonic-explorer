import React, { useMemo } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import Paper, { PaperProps } from "@mui/material/Paper";
import CloseIcon from "../../images/close-icon.svg";

import css from "../../css-modules/draggable-dialog.scss";

const hideBackdropProps = {
  disableEnforceFocus: true,
  style: { pointerEvents: "none" as const },
  PaperProps: { style: { pointerEvents: "auto" as const } }
};

const horizontalPositionClassName = {
  center: "horizontalCenter",
  left: "horizontalLeft",
  right: "horizontalRight"
};

const verticalPositionClassName = {
  center: "verticalCenter",
  top: "verticalTop",
  bottom: "verticalBottom"
};

interface IProps {
  onClose?: () => void;
  backdrop: boolean;
  title: string;
  initialPosition?: { horizontal: "center" | "left" | "right", vertical: "center" | "top" | "bottom" },
  offset?: { x: number, y: number },
  children?: React.ReactNode;
  className?: string;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DraggableDialog: React.FC<IProps> = ({ backdrop, onClose, title, offset, initialPosition, children, className }) => {
  // PaperComponent needs to be memoized, as otherwise it's recreated on every render. This might lead to unexpected
  // side effects like losing input focus on each render.
  const PaperComponentMemoized = useMemo(() => function PaperComponent(props: PaperProps) {
    return (
      <Draggable
        defaultPosition={offset}
        handle="#draggable-dialog-title"
        bounds="#app"
        cancel={'[class*="MuiDialogContent-root"]'}
      >
        <Paper {...props} />
      </Draggable>
    );
  }, [offset]);

  const vertClassName = verticalPositionClassName[initialPosition?.vertical || "center"];
  const horClassName = horizontalPositionClassName[initialPosition?.horizontal || "center"];

  return (
    <Dialog
      {...(backdrop ? {} : hideBackdropProps)}
      className={classNames(className, css.draggableDialog, css[vertClassName], css[horClassName])}
      open={true}
      onClose={onClose}
      PaperComponent={PaperComponentMemoized}
      aria-labelledby="draggable-dialog-title"
      maxWidth={false}
    >
      <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
        { title }
        { onClose && <div className={css.closeIcon} onClick={onClose}><CloseIcon /></div> }
      </DialogTitle>
      <div className={css.dividerLine} />
      { children }
    </Dialog>
  );
};

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DialogButton: React.FC<IButtonProps> = (props) => (
  <button {...props} className={classNames(props.className, css.dialogButton)}>{ props.children }</button>
);
