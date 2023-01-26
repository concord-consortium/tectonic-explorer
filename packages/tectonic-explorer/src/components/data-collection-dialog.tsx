import React, { useCallback } from "react";
import { toJS } from "mobx";
import { DialogButton, DraggableDialog } from "./draggable-dialog";
import { DialogActions } from "@mui/material";
import { dataSampleColumnLabel, dataSampleToTableRow, DataSampleColumnName, getSortedColumns } from "@concord-consortium/tecrock-shared";
import { IDataSample } from "../types";
import { log } from "../log";
import config from "../config";
import CheckIcon from "../assets/check-icon.svg";

import css from "./data-collection-dialog.scss";

interface IProps {
  onClose: () => void;
  onSubmit: () => void;
  onNotesChange: (notes: string) => void;
  currentDataSample: IDataSample;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const DataCollectionDialog: React.FC<IProps> = ({ currentDataSample, onClose, onSubmit, onNotesChange }) => {

  const handleNotesChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(event.target.value);
  }, [onNotesChange]);

  const handleOnSubmit = useCallback(() => {
    // toJS is necessary, as otherwise postMessage throws an error that it can't clone the object.
    // Apparently, MobX observable objects are not cloneable.
    log({ action: "DataCollectionDialogSubmitClicked", data: toJS(currentDataSample) });
    onSubmit();
  }, [onSubmit, currentDataSample]);

  const handleOnDiscard = useCallback(() => {
    log({ action: "DataCollectionDialogDiscardClicked" });
    onClose();
  }, [onClose]);

  const rockRowData = dataSampleToTableRow(currentDataSample);

  const notesEnabled = config.dataSampleColumns.includes("notes");
  // When user is collecting data, notes should show as a separate textfield under the table,
  // so notes column require special handling. Also, there"s no need to display pin id / number.
  const columnsWithoutIdAndNotes = config.dataSampleColumns.filter((column: DataSampleColumnName) => column !== "notes" && column !== "id");
  const sortedColumns = getSortedColumns(columnsWithoutIdAndNotes);

  return (
    <DraggableDialog
      title="Selected Data"
      onClose={handleOnDiscard}
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
          <textarea placeholder="Add notes…" value={currentDataSample.notes} onChange={handleNotesChange} />
        }
        <DialogActions>
          <DialogButton className={css.dialogButton} onClick={handleOnDiscard}>Discard</DialogButton>
          <DialogButton className={css.dialogButton} onClick={handleOnSubmit}><CheckIcon /> Submit</DialogButton>
        </DialogActions>
      </div>
    </DraggableDialog>
  );
};
