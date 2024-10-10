import * as React from "react";
import { useInitMessage, useAutoSetHeight, useReportItem } from "@concord-consortium/lara-interactive-api";
import { reportItemHandler } from "./report-item";
import { IAuthoredState, IInteractiveState } from "../../types";

interface Props { }

export const AppComponent: React.FC<Props> = (props) => {
  const initMessage = useInitMessage();

  useAutoSetHeight();

  useReportItem<IInteractiveState, IAuthoredState>({
    metadata: {
      compactAnswerReportItemsAvailable: true
    },
    handler: reportItemHandler
  });

  if (!initMessage) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  if (initMessage.mode !== "reportItem") {
    return (
      <div>
        This interactive is only available in &apos;reportItem&apos; mode but &apos;{initMessage.mode}&apos; was given.
      </div>
    );
  }

  // Report item app can provide UI in the prompt area too, but TecRock Table never does it. It only responds
  // to getReportItemAnswer post message from the host window (portal report).
  return null;
};
