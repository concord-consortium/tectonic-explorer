import React, { useCallback } from "react";
import { DraggableDialog } from "./draggable-dialog";
import { Button, DialogActions } from "@mui/material";
import { dataSampleColumnLabel, dataSampleToTableRow, DataSampleColumnName, getSortedColumns } from "@concord-consortium/tecrock-shared";
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

  const notesEnabled = config.dataSampleColumns.includes("notes");
  // When user is collecting data, notes should show as a separate textfield under the table,
  // so notes column require special handling.
  const columnsWithoutNotes = notesEnabled ?
    config.dataSampleColumns.filter((column: DataSampleColumnName) => column !== "notes") : config.dataSampleColumns;
  const sortedColumns = getSortedColumns(columnsWithoutNotes);

  return (
    <DraggableDialog
      title="Selected Data"
      onClose={onClose}
      backdrop={false}
      initialPosition={{ vertical: "top", horizontal: "center" }}
    >
      <div className={css.dataCollectionDialogContent}>
        <table>
          <thead>
            <tr>
              {
                sortedColumns.map((column: DataSampleColumnName) => (
                  <th key={column} className={css[column]}>{ dataSampleColumnLabel[column] }</th>
                ))
              }
            </tr>
          </thead>
          <tbody>
            <tr>
              {
                sortedColumns.map((column: DataSampleColumnName) => (
                  <td key={column} className={css[column]}>{ rockRowData[column] }</td>
                ))
              }
            </tr>
          </tbody>
        </table>
        {
          notesEnabled &&
          <textarea key="notes" placeholder="Add notes…" value={currentDataSample.notes} onChange={handleNotesChange} />
        }
      </div>
      <DialogActions>
        <Button onClick={onClose}>Discard</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </DraggableDialog>
  );
};
