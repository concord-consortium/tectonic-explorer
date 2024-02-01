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
function runInReportItem() {
  // Setup table scaling
  const table = document.body.getElementsByTagName("table")[0];
  if (!table) {
    return;
  }
  const tableParent = table.parentElement;
  if (!tableParent) {
    return;
  }

  // ResizeObserver is necessary to handle situations when Dashboard is animating the width of the report item container.
  let firstResize = true;
  let resizeTimeout: number | null = null;
  let prevWidth = -Infinity;
  function onResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    function resize() {
      if (!tableParent) {
        return;
      }
      if (tableParent.offsetWidth <= prevWidth) {
        return;
      }
      // The Dashboard currently sets the height of the report-item iframe almost immediately. However, in some cases,
      // it also animates the width of the report item container. This animation can cause the table width and height
      // to be calculated as 0, which results in an incorrect iframe height. To work around this issue, we set the
      // minimum width of the table parent to 230px. This width is approximately equivalent to the width of the table
      // in its narrowest view. It will enforce realistic height of the Dashboard report-item iframe.
      const MIN_WIDTH_DASHBOARD_WORKAROUND = 230;

      const originalWidth = table.offsetWidth;
      const originalHeight = table.offsetHeight;
      const parentWidth = Math.max(MIN_WIDTH_DASHBOARD_WORKAROUND, tableParent.offsetWidth);

      const scale = parentWidth / originalWidth;

      table.style.transform = `scale(${scale})`;
      table.style.width = `${Math.round(scale * originalWidth)}px`;
      const newHeight = Math.round(scale * originalHeight);
      table.style.height = tableParent.style.height = `${newHeight}px`;

      firstResize = false;
      prevWidth = tableParent.offsetWidth;
    }
    firstResize ? resize() : (resizeTimeout = window.setTimeout(resize, 100));
  }
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(document.body);
  tableParent.style.overflow = "hidden";

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
}
// runInReportItem.name is necessary (rather than just using runInReportItem()) because the webpack optimizer might
// change function name or even inline the function, which would break the code.
const reportItemScript = "<script>" + runInReportItem.toString() + `\n ${runInReportItem.name}(); </script>`;

export const reportItemHandler: IGetReportItemAnswerHandler<ITectonicExplorerInteractiveState, IAuthoredState> = request => {
  const { platformUserId, version, itemsType } = request;

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

    items.push({ type: "html", html: htmlWithInlineStyles });
    sendReportItemAnswer({ version, platformUserId, items, itemsType });
  } else {
    // tslint:disable-next-line:no-console
    console.error(
      "TecRock Table Report Item Interactive: Unsupported version in getReportItemAnswer request:",
      version
    );
  }
};
