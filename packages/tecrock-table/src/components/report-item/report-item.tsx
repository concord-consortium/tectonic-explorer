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

export const reportItemHandler: IGetReportItemAnswerHandler<ITectonicExplorerInteractiveState, IAuthoredState> = request => {
  const {platformUserId, version, itemsType} = request;

  if (!version) {
    // for hosts sending older, unversioned requests
    // tslint:disable-next-line:no-console
    console.error("TecRock Table Report Item Interactive: Missing version in getReportItemAnswer request.");
  }
  else if (semver.satisfies(version, "2.x")) {
    const items: IReportItemAnswerItem[] = [];
    const htmlWithInlineStyles = renderToStringWithCss(
      <Table interactiveState={request.interactiveState} />,
      inlineCss,
      classMap
    );
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
