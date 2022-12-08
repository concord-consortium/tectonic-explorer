import * as React from "react";
import { DraggableDialog } from "./draggable-dialog";
import { Button, DialogActions } from "@mui/material";
import { IUserCollectedData } from "../types";

import css from "../../css-modules/data-collection-dialog.less";

interface IProps {
  onClose: () => void;
  onSubmit: () => void;
  collectedData: IUserCollectedData;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DataCollectionDialog = ({ collectedData, onClose, onSubmit }: IProps) => {
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
            <tr><td>Rock</td><td>{ collectedData.rock }</td></tr>
            <tr><td>Temperature</td><td>{ collectedData.temperature }</td></tr>
            <tr><td>Pressure</td><td>{ collectedData.temperature }</td></tr>
          </tbody>
        </table>
      </div>
      <DialogActions>
        <Button onClick={onSubmit}>Submit</Button>
        <Button onClick={onClose}>Discard</Button>
      </DialogActions>
    </DraggableDialog>
  );
};
