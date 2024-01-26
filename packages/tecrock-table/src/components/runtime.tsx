import React, { useEffect, useCallback } from "react";
import classNames from "classnames";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Table } from "./table";
import { IAuthoredState } from "../types";
import { addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, showModal } from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { ITectonicExplorerInteractiveState } from "@concord-consortium/tecrock-shared";
import Prompt from "../assets/collect-data-prompt.png";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, ITectonicExplorerInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const { dataSamples } = interactiveState || {};

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
        // Render placeholder image if there are no data samples.
        (!dataSamples || !dataSamples.length) &&
        <div className={css.placeholder}>
          <img src={Prompt}/>
        </div>
      }
      {
        // Do not render table when there are no data samples.
        dataSamples && dataSamples.length > 0 &&
        <Table interactiveState={interactiveState} handleExpandSnapshot={handleExpandSnapshot} />
      }
    </div>
  );
};
