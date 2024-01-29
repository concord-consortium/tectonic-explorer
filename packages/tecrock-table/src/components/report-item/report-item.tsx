import * as React from "react";
import * as semver from "semver";
import { sendReportItemAnswer, IReportItemAnswerItem, IGetReportItemAnswerHandler } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState } from "../../types";
import { ITectonicExplorerInteractiveState } from "@concord-consortium/tecrock-shared";
import { renderToStringWithCss } from "./render-to-string";

import { Table } from "../table";
// The `.inline` suffix will trigger a Webpack loader that simply converts SCSS to CSS and returns it as a string.
import inlineCss from "../table.inline.scss";
// Regular `.scss` files use CSS modules and return a map of class names to unique identifiers. This map is later
// used to replace class names in the `inlineCss` file.
import classMap from "../table.scss";

// A method to execute any JavaScript code in the report-item iframe. This is necessary to set up table scaling for
// narrow views and to enable snapshot clicking. This approach is quite limited, but it suffices for our needs in
// this specific case.
const reportItemScript =
  "<script>" + (function runInReportItem() {
    // Setup table scaling
    const table = document.body.getElementsByTagName("table")[0];
    if (!table) {
      return;
    }
    const tableParent = table.parentElement;
    if (!tableParent) {
      return;
    }
    if (table.offsetWidth > tableParent.offsetWidth) {
      // Table is wider than its parent, there is a horizontal scrollbar, so we need to scale it down.
      const originalWidth = table.offsetWidth;
      const originalHeight = table.offsetHeight;
      const scale = tableParent.offsetWidth / (originalWidth + 1);
      table.style.transform = `scale(${scale})`;
      table.style.width = tableParent.style.width = `${scale * originalWidth}px`;
      table.style.height = tableParent.style.height = (scale * originalHeight) + "px";
      tableParent.style.overflow = "hidden";
    }
    // Set up the snapshot click handler. This is implemented in the Table component, but it won't work in the report
    // item because the component is rendered to a string and sent in that form. Fortunately, it's easy to
    // reimplement it here.
    const snapshots = document.body.getElementsByTagName("img");
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      snapshot.addEventListener("click", () => {
        window.open(snapshot.src, "_blank");
      });
    }
  }).toString() +
  "\nrunInReportItem(); </script>";

export const reportItemHandler: IGetReportItemAnswerHandler<ITectonicExplorerInteractiveState, IAuthoredState> = request => {
  const {platformUserId, version, itemsType} = request;

  if (!version) {
    // for hosts sending older, unversioned requests
    // tslint:disable-next-line:no-console
    console.error("TecRock Table Report Item Interactive: Missing version in getReportItemAnswer request.");
  }
  else if (semver.satisfies(version, "2.x")) {
    const items: IReportItemAnswerItem[] = [];
    const htmlWithInlineStyles =
      renderToStringWithCss(
        <Table interactiveState={request.interactiveState} />,
        inlineCss,
        classMap
      ) +
      // Add a stringified script tag to the end of the HTML string. It's important to do it after the closing body tag,
      // because otherwise the script will be executed before the table is rendered. That way we can avoid using
      // DOM mutation observers to detect when the table is rendered or relying on other callbacks or timing tricks.
      reportItemScript;

    items.push({type: "html", html: htmlWithInlineStyles});
    sendReportItemAnswer({version, platformUserId, items, itemsType});
  } else {
    // tslint:disable-next-line:no-console
    console.error(
      "TecRock Table Report Item Interactive: Unsupported version in getReportItemAnswer request:",
      version
    );
  }
};
