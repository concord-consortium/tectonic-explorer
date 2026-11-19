import React, { PureComponent } from "react";
import { LicenseCopy } from "./license/license-copy";

function getURL() {
  return window.location.href;
}

function getIframeString() {
  return `<iframe width='1000px' height='800px' frameborder='no' scrolling='no' allowfullscreen='true' src='${getURL()}'></iframe>`;
}

export default class ShareDialogContent extends PureComponent {
  render() {
    return (
      <div>
        <p>
          Paste this link in email or IM.
          <textarea id="page-url" value={getURL()} readOnly />
        </p>
        <p>
          Paste HTML to embed in website or blog.
          <textarea id="iframe-string" value={getIframeString()} readOnly style={{ height: "4em" }} />
        </p>
        <LicenseCopy />
      </div>
    );
  }
}
