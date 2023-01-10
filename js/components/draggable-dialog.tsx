import * as React from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import Paper, { PaperProps } from "@mui/material/Paper";
import CloseIcon from "../../images/rock-key/svg/close-icon.svg";

import css from "../../css-modules/draggable-dialog.less";

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
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DraggableDialog: React.FC<IProps> = ({ backdrop, onClose, title, offset, initialPosition, children }) => {
  function PaperComponent(props: PaperProps) {
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
  }

  const vertClassName = verticalPositionClassName[initialPosition?.vertical || "center"];
  const horClassName = horizontalPositionClassName[initialPosition?.horizontal || "center"];

  return (
    <Dialog
      {...(backdrop ? {} : hideBackdropProps)}
      className={classNames(css.draggableDialog, css[vertClassName], css[horClassName])}
      open={true}
      onClose={onClose}
      PaperComponent={PaperComponent}
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
