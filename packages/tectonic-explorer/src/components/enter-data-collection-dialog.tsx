import React from "react";
import { DialogActions } from "@mui/material";
import { DialogButton, DraggableDialog } from "./draggable-dialog";
import { log } from "../log";

import css from "./enter-data-collection-dialog.scss";

interface IProps {
  onCancel: () => void;
  onEraseAndStartOver: () => void;
}

export const EnterDataCollectionDialog: React.FC<IProps> = (props) => {
  const { onCancel, onEraseAndStartOver } = props;

  const handleCancel = () => {
    log({ action: "EnterDataCollectionDialogCancelClicked" });
    onCancel();
  };

  const handleSaveAndExit = () => {
    log({ action: "EnterDataCollectionDialogEraseAndStartOverClicked" });
    onEraseAndStartOver();
  };

  return (
    <DraggableDialog
      title="Data Collection Mode"
      onClose={undefined}
      backdrop={true}
      initialPosition={{ vertical: "top", horizontal: "center" }}
    >
      <div className={css.enterDataCollectionDialogContent}>
        <p>
          Entering data collection mode again will erase previously saved samples.
          If you are sure you want to do it, click Erase data & Start over.
        </p>
        <p>If you do not want to erase previous data, click Cancel.</p>
        <DialogActions>
          <DialogButton className={css.dialogButton} onClick={handleCancel}>Cancel</DialogButton>
          <DialogButton className={css.dialogButton} onClick={handleSaveAndExit}>Erase previous data & Start over</DialogButton>
        </DialogActions>
      </div>
    </DraggableDialog>
  );
};
