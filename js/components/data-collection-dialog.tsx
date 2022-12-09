import * as React from "react";
import { DraggableDialog } from "./draggable-dialog";
import { Button, DialogActions } from "@mui/material";
import { IDataSample } from "../types";

import css from "../../css-modules/data-collection-dialog.less";

interface IProps {
  onClose: () => void;
  onSubmit: () => void;
  currentDataSample: IDataSample;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DataCollectionDialog = ({ currentDataSample, onClose, onSubmit }: IProps) => {
  return (
    <DraggableDialog
      title="Selected Rock Data"
      onClose={onClose}
      backdrop={false}
      initialPosition={{ vertical: "center", horizontal: "center" }}
    >
      <div className={css.dataCollectionDialogContent}>
        <table>
          <tbody>
            <tr><td>Rock</td><td>{ currentDataSample.rockLabel }</td></tr>
            <tr><td>Temperature</td><td>{ currentDataSample.temperature }</td></tr>
            <tr><td>Pressure</td><td>{ currentDataSample.temperature }</td></tr>
          </tbody>
        </table>
      </div>
      <DialogActions>
        <Button onClick={onClose}>Discard</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </DraggableDialog>
  );
};
