import React, { useEffect, useCallback } from "react";
import classNames from "classnames";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState } from "../types";
import { addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, showModal } from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { dataSampleColumnLabel, DataSampleColumnName, dataSampleToTableRow, getSortedColumns, ITectonicExplorerInteractiveState } from "@concord-consortium/tecrock-shared";
import ZoomIn from "../assets/zoom-in.svg";
import Prompt from "../assets/collect-data-prompt.png";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, ITectonicExplorerInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const { dataSamples, dataSampleColumns, planetViewSnapshot, crossSectionSnapshot } = interactiveState || {};

  console.log("I am runtime tecrock table yay!");
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

  const sortedColumns = dataSampleColumns ? getSortedColumns(dataSampleColumns) : [];
  const decorateOptions = useGlossaryDecoration();

  const handleExpandSnapshot = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    const url = (event.target as HTMLImageElement)?.src;
    if (!url) {
      return;
    }

    if (!report) {
      // AP runtime supports `showModal` API, so we can open a lightbox.
      showModal({ type: "lightbox", url: url.toString(), isImage: true });
    } else {
      // Report doesn't support `showModal` API, so opening a new browser tab is the only option.
      window.open(url.toString(), "_blank");
    }
  }, [report]);

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
      {
        //
        !dataSamples &&
        <div className={css.placeholder}>
          <img src={Prompt}/>
        </div>
      }
      {
        // Do not render table at all when there are no data samples.
        dataSamples && dataSamples.length > 0 &&
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
                <img src={planetViewSnapshot} alt="Planet view snapshot" onClick={handleExpandSnapshot} />
                <ZoomIn />
              </div>
            }
            {
              crossSectionSnapshot &&
              <div className={css.imgContainer}>
                <img src={crossSectionSnapshot} alt="Cross-section snapshot" onClick={handleExpandSnapshot} />
                <ZoomIn />
              </div>
            }
          </div>
        </div>
      }

    </div>
  );
};
