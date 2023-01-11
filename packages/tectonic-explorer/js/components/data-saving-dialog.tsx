import * as React from "react";
import { DraggableDialog } from "./draggable-dialog";
import ProgressBar from "react-toolbox/lib/progress_bar";

import css from "../../css-modules/data-saving-dialog.less";

interface IProps {
  onClose: () => void;
  dataSavingInProgress: boolean;
}

export const DataSavingDialog = ({ onClose, dataSavingInProgress }: IProps) => {
  const dataSavingMsg = (
    <>
      <ProgressBar type="circular" mode="indeterminate" multicolor />
      <p>Please wait while data is being saved...</p>
    </>
  );
  const dataSavedMsg = <p>Your data has been saved to the table below. Your pins will now be removed.</p>;
  return (
    <DraggableDialog
      title={dataSavingInProgress ? "Data Saving..." : "Data Saved"}
      // Users can't close the dialog while data is being saved.
      onClose={dataSavingInProgress ? undefined : onClose}
      backdrop={true}
      initialPosition={{ vertical: "center", horizontal: "center" }}
    >
      <div className={css.dataSavingDialogContent}>
        { dataSavingInProgress ? dataSavingMsg : dataSavedMsg }
      </div>
    </DraggableDialog>
  );
};
