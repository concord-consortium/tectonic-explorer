import React, { useState } from "react";
import { DialogActions } from "@mui/material";
import { DialogButton, DraggableDialog } from "./draggable-dialog";
import ProgressBar from "react-toolbox/lib/progress_bar";
import CheckIcon from "../assets/check-icon.svg";
import { log } from "../log";

import css from "./exit-data-collection-dialog.scss";
import { DATA_COLLECTION_YOFFSET } from "../types";

interface IProps {
  onContinue: () => void;
  onSaveAndExit: () => void;
  dataSavingInProgress: boolean;
}

const QuestionContent: React.FC<Pick<IProps, "onContinue" | "onSaveAndExit">> = ({ onContinue, onSaveAndExit }) => {
  return (
    <>
      <p>
      You cannot collect more than 20 samples.
      If you want to sample more areas, you must restart your data collection.
      If you are satisfied with the samples you have taken, please move on to the questions below.
      </p>
      <p>If you are not finished collecting data, click Continue.</p>
      <DialogActions>
        {/* <DialogButton className={css.dialogButton} onClick={onContinue}>Continue</DialogButton>
        <DialogButton className={css.dialogButton} onClick={onSaveAndExit}><CheckIcon /> Save & Exit</DialogButton> */}
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

export const LimitCrossSectionPinsDialog: React.FC<IProps> = (props) => {
  const { dataSavingInProgress, onContinue, onSaveAndExit } = props;
  const [saveAndExitClicked, setSaveAndExitClicked] = useState(false);

  const handleContinue = () => {
    // log({ action: "ExitDataCollectionDialogContinueClicked" });
    onContinue();
  };

  const handleSaveAndExit = () => {
    setSaveAndExitClicked(true);
    // log({ action: "ExitDataCollectionDialogSaveAndExitClicked" });
    onSaveAndExit();
  };

  return (
    <DraggableDialog
      title="Placeholder Title"
      onClose={undefined}
      backdrop={true}
      offset={{x: 0, y: DATA_COLLECTION_YOFFSET}}
      initialPosition={{ vertical: "bottom", horizontal: "center" }}
    >
      <div className={css.limitCrossSectionPins}>
        {
          dataSavingInProgress && saveAndExitClicked ?
          <DataSavingContent /> :
          <QuestionContent onContinue={handleContinue} onSaveAndExit={handleSaveAndExit} />
        }
      </div>
    </DraggableDialog>
  );
};
