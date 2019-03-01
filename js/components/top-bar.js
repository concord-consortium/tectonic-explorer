import React, { PureComponent } from 'react'
import FontIcon from 'react-toolbox/lib/font_icon'
import { Dialog } from 'react-toolbox/lib/dialog'
import ShareDialogContent from './share-dialog-content'
import AboutDialogContent from './about-dialog-content'

import css from '../../css-modules/top-bar.less'
import aboutTheme from '../../css-modules/about-dialog.less'
import shareTheme from '../../css-modules/share-dialog.less'

function reloadPage () {
  window.location.reload()
}

function copyTextarea (textAreaId) {
  document.querySelector('textarea#' + textAreaId).select()
  document.execCommand('copy')
}

export default class TopBar extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      shareDialogOpen: false,
      aboutDialogOpen: false
    }
    this.openShareDialog = this.openShareDialog.bind(this)
    this.openAboutDialog = this.openAboutDialog.bind(this)
    this.closeShareDialog = this.closeShareDialog.bind(this)
    this.closeAboutDialog = this.closeAboutDialog.bind(this)
  }

  openShareDialog () {
    this.setState({ shareDialogOpen: true, aboutDialogOpen: false })
  }

  openAboutDialog () {
    this.setState({ aboutDialogOpen: true, shareDialogOpen: false })
  }

  closeShareDialog () {
    this.setState({ shareDialogOpen: false })
  }

  closeAboutDialog () {
    this.setState({ aboutDialogOpen: false })
  }

  render () {
    const { shareDialogOpen, aboutDialogOpen } = this.state

    return (
      <div className={css.topBar} data-test='top-bar'>
        <FontIcon className={css.reload} value='refresh' data-test='top-bar-refresh' onClick={reloadPage} />
        <span className={css.about} onClick={this.openAboutDialog} data-test='top-bar-about'>About</span>
        <span className={css.share} onClick={this.openShareDialog} data-test='top-bar-share'>Share</span>

        <Dialog
          actions={[{ label: 'close', onClick: this.closeAboutDialog }]}
          active={aboutDialogOpen}
          onEscKeyDown={this.closeAboutDialog}
          onOverlayClick={this.closeAboutDialog}
          title='About: Tectonic Explorer'
          theme={aboutTheme}
          data-test='about-dialog'
        >
          <AboutDialogContent />
        </Dialog>
        <Dialog
          actions={[
            { label: 'copy link', onClick: function () { copyTextarea('page-url') } },
            { label: 'copy html', onClick: function () { copyTextarea('iframe-string') } },
            { label: 'close', onClick: this.closeShareDialog }
          ]}
          active={shareDialogOpen}
          onEscKeyDown={this.closeShareDialog}
          onOverlayClick={this.closeShareDialog}
          title='Share: Tectonic Explorer'
          theme={shareTheme}
        >
          <ShareDialogContent />
        </Dialog>
      </div>
    )
  }
}
