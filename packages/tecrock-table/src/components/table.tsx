import React, { useCallback, useMemo } from "react";
import { dataSampleColumnLabel, DataSampleColumnName, dataSampleToTableRow, getSortedColumns, RockKeyLabelArray } from "@concord-consortium/tecrock-shared";
import ZoomIn from "../assets/zoom-in.svg";
import Correct from "../assets/pointy-pin-correct.svg";
import Incorrect from "../assets/pointy-pin-incorrect.svg";
import { IAuthoredState, IInteractiveState } from "../types";
import { UpdateFunc } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { log } from "@concord-consortium/lara-interactive-api";
import { checkRockData } from "../utils/check-rock-data";

import css from "./table.scss";

interface IProps {
  interactiveState?: IInteractiveState | null;
  authoredState?: IAuthoredState;
  report?: boolean;
  handleExpandSnapshot?: (event: React.MouseEvent<HTMLImageElement>) => void;
  setInteractiveState?: (updateFunc: UpdateFunc<IInteractiveState>) => void;
}

const emptyInteractiveState = {
  dataSamples: [],
  dataSampleColumns: [],
} as unknown as IInteractiveState;

export const Table: React.FC<IProps> = ({ authoredState, interactiveState, report, setInteractiveState, handleExpandSnapshot }) => {
  const { dataSamples, dataSampleColumns, planetViewSnapshot, crossSectionSnapshot, tableState } = interactiveState || emptyInteractiveState;
  const {checkDataHash, linkedStateHash} = tableState ?? {};

  const sortedColumns = getSortedColumns(dataSampleColumns);

  const {checkData, requiredRockTypes} = useMemo(() => {
    // in report mode we don't have access to the authored state so we use the interactive state set when
    // the check data button is pressed
    const state = report ? interactiveState?.tableState : authoredState;
    return {
      checkData: !!(state?.checkData),
      requiredRockTypes: (state?.requiredRockTypes ?? []) as RockKeyLabelArray,
    };
  }, [authoredState, interactiveState, report]);
  const canCheckData = checkData && requiredRockTypes.length > 0;
  const showCheckDataButton = canCheckData && !report;
  const showCheckDataResults = canCheckData && checkDataHash !== undefined && linkedStateHash !== undefined && checkDataHash === linkedStateHash;

  const checkDataResults = useMemo(() => {
    if (!showCheckDataResults || dataSamples.length === 0) {
      return null;
    }

    const {collected, stillNeeded} = checkRockData(dataSamples, requiredRockTypes);

    let Icon = Incorrect;
    let message: JSX.Element;
    if (collected.length === 0) {
      message = (
        <>
          <p>You have not yet collected data on the types of rock needed to answer this question!</p>
          <p>Go back and read the instructions again. You may need to run TecRocks Explorer longer or try drawing your cross-section in a different area.</p>
        </>
      );
    } else if (stillNeeded.length > 0) {
      message = (
        <>
          <p>You collected <strong>{collected.length} of the types of rock</strong> you need to answer this question. You still need to collect data on <strong>{stillNeeded.length} more</strong>.</p>
          <p>Go back to the TecRocks Explorer and collect data on: {stillNeeded.map((rock, index) => <strong key={rock}>{rock}{index + 1 < stillNeeded.length ? ", " : ""}</strong>)}.</p>
        </>
      );
    } else {
      Icon = Correct;
      message = <p>Great job, you have collected all the rock types needed for this question!</p>;
    }

    return (
      <div className={css.checkDataResults} style={report ? {display: "flex", gap: 10, alignItems: "center"} : {}}>
        <div>
          <Icon />
        </div>
        <div>
          {message}
        </div>
      </div>
    );
  }, [showCheckDataResults, requiredRockTypes, dataSamples, report]);

  const handleCheckDataClicked = useCallback(() => {
    const {sampled, collected, stillNeeded} = checkRockData(dataSamples, requiredRockTypes);
    log("CheckDataButtonClicked", {requiredRockTypes, sampled, collected, stillNeeded});

    setInteractiveState?.((prev: IInteractiveState) => {
      return {...prev, tableState: {...prev.tableState, checkDataHash: prev.tableState?.linkedStateHash, checkData: true, requiredRockTypes}};
    });
  }, [dataSamples, requiredRockTypes, setInteractiveState]);

  if (dataSamples.length === 0) {
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
        <div className={css.checkData} style={report ? {marginTop: 10} : {}}>
          {showCheckDataButton && (
            <div className={css.buttonContainer}>
              <button disabled={showCheckDataResults} onClick={handleCheckDataClicked}>Check Data</button>
            </div>
          )}
          {checkDataResults}
        </div>
      </div>
      <div className={css.snapshots}>
        {
          planetViewSnapshot &&
          <div className={css.imgContainer}>
            <img style={{width: "100%"}} src={planetViewSnapshot} alt="Planet view snapshot" onClick={handleExpandSnapshot} />
            <ZoomIn />
          </div>
        }
        {
          crossSectionSnapshot &&
          <div className={css.imgContainer}>
            <img style={{width: "100%"}} src={crossSectionSnapshot} alt="Cross-section snapshot" onClick={handleExpandSnapshot} />
            <ZoomIn />
          </div>
        }
      </div>
    </div>
  );
};
