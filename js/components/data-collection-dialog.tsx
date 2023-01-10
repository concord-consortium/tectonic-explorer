import React, { useCallback } from "react";
import { DraggableDialog } from "./draggable-dialog";
import { Button, DialogActions } from "@mui/material";
import { rockColumnLabel, dataSampleToTableRow, RockSampleColumnName } from "../shared";
import { IDataSample } from "../types";
import config from "../config";

import css from "../../css-modules/data-collection-dialog.less";

interface IProps {
  onClose: () => void;
  onSubmit: () => void;
  onNotesChange: (notes: string) => void;
  currentDataSample: IDataSample;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DataCollectionDialog = ({ currentDataSample, onClose, onSubmit, onNotesChange }: IProps) => {

  const handleNotesChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(event.target.value);
  }, [onNotesChange]);

  const rockRowData = dataSampleToTableRow(currentDataSample);

  return (
    <DraggableDialog
      title="Selected Data"
      onClose={onClose}
      backdrop={false}
      initialPosition={{ vertical: "top", horizontal: "center" }}
    >
      <div className={css.dataCollectionDialogContent}>
        <table>
          <tbody>
            <tr>
              {
                config.rockSampleColumns.map((column: RockSampleColumnName) => (
                  <th key={column} className={css[column]}>{ rockColumnLabel[column] }</th>
                ))
              }
            </tr>
            <tr>
              {
                config.rockSampleColumns.map((column: RockSampleColumnName) => (
                  <td key={column}>{ rockRowData[column] }</td>
                ))
              }
            </tr>
          </tbody>
        </table>
        <textarea key="notes" placeholder="Add notes…" value={currentDataSample.notes} onChange={handleNotesChange} />
      </div>
      <DialogActions>
        <Button onClick={onClose}>Discard</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </DraggableDialog>
  );
};
