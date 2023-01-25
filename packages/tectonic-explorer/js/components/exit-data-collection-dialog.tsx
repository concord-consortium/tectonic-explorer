import React, { useState } from "react";
import { DialogActions } from "@mui/material";
import { DialogButton, DraggableDialog } from "./draggable-dialog";
import ProgressBar from "react-toolbox/lib/progress_bar";
import CheckIcon from "../../images/check-icon.svg";
import { log } from "../log";

import css from "../../css-modules/exit-data-collection-dialog.scss";

interface IProps {
  onContinue: () => void;
  onSaveAndExit: () => void;
  dataSavingInProgress: boolean;
}

const QuestionContent: React.FC<Pick<IProps, "onContinue" | "onSaveAndExit">> = ({ onContinue, onSaveAndExit }) => {
  return (
    <>
      <p>
        Are you finished collecting data? If you are finished placing pins, click Save & Exit.
        Your data will be saved in the table, you will exit data collection mode, and your pins will be removed.
      </p>
      <p>If you are not finished collecting data, click Continue.</p>
      <DialogActions>
        <DialogButton className={css.dialogButton} onClick={onContinue}>Continue</DialogButton>
        <DialogButton className={css.dialogButton} onClick={onSaveAndExit}><CheckIcon /> Save & Exit</DialogButton>
      </DialogActions>
    </>
  );
};

const DataSavingContent: React.FC = () => {
  return (
    <div className={css.dataSavingMessage}>
      <ProgressBar type="circular" mode="indeterminate" multicolor />
      <p>Please wait while data is being saved...</p>
    </div>
  );
};

export const ExitDataCollectionDialog: React.FC<IProps> = (props) => {
  const { dataSavingInProgress, onContinue, onSaveAndExit } = props;
  const [saveAndExitClicked, setSaveAndExitClicked] = useState(false);

  const handleContinue = () => {
    log({ action: "ExitDataCollectionDialogContinueClicked" });
    onContinue();
  };

  const handleSaveAndExit = () => {
    setSaveAndExitClicked(true);
    log({ action: "ExitDataCollectionDialogSaveAndExitClicked" });
    onSaveAndExit();
  };

  return (
    <DraggableDialog
      title="Exit Data Collection Mode"
      onClose={undefined}
      backdrop={true}
      initialPosition={{ vertical: "top", horizontal: "center" }}
    >
      <div className={css.exitDataCollectionDialogContent}>
        {
          dataSavingInProgress && saveAndExitClicked ?
          <DataSavingContent /> :
          <QuestionContent onContinue={handleContinue} onSaveAndExit={handleSaveAndExit} />
        }
      </div>
    </DraggableDialog>
  );
};
