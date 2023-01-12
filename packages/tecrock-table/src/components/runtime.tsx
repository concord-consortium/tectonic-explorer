import React, { useEffect } from "react";
import classNames from "classnames";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState } from "../types";
import { addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener } from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { dataSampleColumnLabel, DataSampleColumnName, dataSampleToTableRow, ITectonicExplorerInteractiveState } from "@concord-consortium/tecrock-shared";
import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, ITectonicExplorerInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const { dataSamples, dataSampleColumns, planetViewSnapshot, crossSectionSnapshot } = interactiveState || {};

  useEffect(() => {
    if (!dataSourceInteractive) {
      return;
    }

    const listener = (newLinkedIntState: ITectonicExplorerInteractiveState | undefined) => {
      if (!newLinkedIntState) {
        return;
      }

      const isValidVersion = newLinkedIntState && Number(newLinkedIntState.version) === 1;
      if (!isValidVersion) {
        console.warn(`Linked interactive state version ${newLinkedIntState.version} is not supported`);
        return;
      }
      // Simply save linked state as our own interactive state. Currently, it's the only way to show anything in the report.
      // Reports don't support linked interactive state observing (yet?).
      setInteractiveState?.(prev => newLinkedIntState);
    };
    const options = { interactiveItemId: dataSourceInteractive };
    addLinkedInteractiveStateListener<any>(listener, options);
    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive, setInteractiveState]);

  const decorateOptions = useGlossaryDecoration();
  return (
    <div className={classNames(css.tecRockTable, { [css.report]: report })}>
      {
        authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt} data-testid="legend">
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren>
      }
      <div className={css.tableAndSnapshots}>
        <div className={css.table}>
        <table>
          <tbody>
            <tr>
              {
                dataSampleColumns && dataSampleColumns.map((column: DataSampleColumnName) => (
                  <th key={column} className={css[column]}>{ dataSampleColumnLabel[column] }</th>
                ))
              }
            </tr>
            {
              dataSamples && dataSamples.map(sample => dataSampleToTableRow(sample)).map((rockRowData, idx) => (
                <tr key={idx}>
                  {
                    dataSampleColumns && dataSampleColumns.map((column: DataSampleColumnName) => (
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
          { planetViewSnapshot && <img src={planetViewSnapshot} alt="Planet view snapshot" /> }
          { crossSectionSnapshot && <img src={crossSectionSnapshot} alt="Cross-section snapshot" /> }
        </div>
      </div>
    </div>
  );
};
