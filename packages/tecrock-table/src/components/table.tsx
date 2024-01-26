import React from "react";
import { dataSampleColumnLabel, DataSampleColumnName, dataSampleToTableRow, getSortedColumns, ITectonicExplorerInteractiveState } from "@concord-consortium/tecrock-shared";
import ZoomIn from "../assets/zoom-in.svg";

import css from "./table.scss";

interface IProps {
  interactiveState?: ITectonicExplorerInteractiveState | null;
  handleExpandSnapshot?: (event: React.MouseEvent<HTMLImageElement>) => void;
}

export const Table: React.FC<IProps> = ({ interactiveState, handleExpandSnapshot }) => {
  const { dataSamples, dataSampleColumns, planetViewSnapshot, crossSectionSnapshot } = interactiveState || {};

  const sortedColumns = dataSampleColumns ? getSortedColumns(dataSampleColumns) : [];

  if (!dataSamples || dataSamples.length === 0) {
    return null;
  }

  return (
    <div className={css.tableAndSnapshots}>
      <div className={css.table}>
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
          {
            dataSamples.map(sample => dataSampleToTableRow(sample)).map((rockRowData, idx) => (
              <tr key={idx}>
                {
                  sortedColumns.map((column: DataSampleColumnName) => (
                    <td key={column} className={css[column]}>{ rockRowData[column] }</td>
                  ))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
      </div>
      <div className={css.snapshots}>
        {
          planetViewSnapshot &&
          <div className={css.imgContainer}>
            <img style={{width: "100%"}} src={planetViewSnapshot} alt="Planet view snapshot" onClick={handleExpandSnapshot} />
            { handleExpandSnapshot && <ZoomIn /> }
          </div>
        }
        {
          crossSectionSnapshot &&
          <div className={css.imgContainer}>
            <img style={{width: "100%"}} src={crossSectionSnapshot} alt="Cross-section snapshot" onClick={handleExpandSnapshot} />
            { handleExpandSnapshot && <ZoomIn /> }
          </div>
        }
      </div>
    </div>
  );
};
