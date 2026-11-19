import React, { createRef, PureComponent } from "react";
import FontIcon from "react-toolbox/lib/font_icon";
import { TopBarDialog } from "./top-bar-dialog";
import ShareDialogContent from "./share-dialog-content";
import AboutDialogContent from "./about-dialog-content";
import { log } from "../log";
import { removeURLParamsAndReload } from "../utils";

import css from "./top-bar.scss";
import aboutTheme from "./about-dialog.scss";
import shareTheme from "./share-dialog.scss";

function reloadPage() {
  log({ action: "ReloadIconClicked" });
  setTimeout(() => {
    // Delay reload so the log request can be issued. This feature will be probably removed, so I don't think
    // it's worth implementing any sophisticated checks if the log message was actually delivered.
    removeURLParamsAndReload(["geode", "rocks"]);
  }, 150);
}

function copyTextarea(textAreaId: string) {
  const textarea: HTMLTextAreaElement | null = document.querySelector("textarea#" + textAreaId);
  if (textarea) {
    textarea.select();
    document.execCommand("copy");
  }
}

interface IProps { }
interface IState {
  shareDialogOpen: boolean;
  aboutDialogOpen: boolean;
}

export default class TopBar extends PureComponent<IProps, IState> {
  private aboutButton = createRef<HTMLButtonElement>();
  private shareButton = createRef<HTMLButtonElement>();

  constructor(props: IProps) {
    super(props);
    this.state = {
      shareDialogOpen: false,
      aboutDialogOpen: false
    };
    this.openShareDialog = this.openShareDialog.bind(this);
    this.openAboutDialog = this.openAboutDialog.bind(this);
    this.closeShareDialog = this.closeShareDialog.bind(this);
    this.closeAboutDialog = this.closeAboutDialog.bind(this);
  }

  openShareDialog() {
    this.setState({ shareDialogOpen: true, aboutDialogOpen: false });
    log({ action: "ShareDialogOpened" });
  }

  openAboutDialog() {
    this.setState({ aboutDialogOpen: true, shareDialogOpen: false });
    log({ action: "AboutDialogOpened" });
  }

  closeShareDialog() {
    this.setState({ shareDialogOpen: false });
  }

  closeAboutDialog() {
    this.setState({ aboutDialogOpen: false });
  }

  render() {
    const { shareDialogOpen, aboutDialogOpen } = this.state;
    return (
      <div className={css.topBar} data-test="top-bar">
        <FontIcon className={css.reload} value="refresh" data-test="top-bar-refresh" onClick={reloadPage} />
        <button type="button" ref={this.aboutButton} className={css.about} onClick={this.openAboutDialog} data-test="top-bar-about">About</button>
        <button type="button" ref={this.shareButton} className={css.share} onClick={this.openShareDialog} data-test="top-bar-share">Share</button>

        <TopBarDialog active={aboutDialogOpen} onClose={this.closeAboutDialog} opener={this.aboutButton} title="About: Tectonic Explorer" theme={aboutTheme}>
          <AboutDialogContent />
        </TopBarDialog>
        <TopBarDialog actions={[
          {
            label: "Copy Link",
            onClick() {
              copyTextarea("page-url");
            }
          },
          {
            label: "Copy HTML",
            onClick() {
              copyTextarea("iframe-string");
            }
          }
        ]} active={shareDialogOpen} onClose={this.closeShareDialog} opener={this.shareButton} title="Share: Tectonic Explorer" theme={shareTheme}>
          <ShareDialogContent />
        </TopBarDialog>
      </div>
    );
  }
}
