import React, { PureComponent } from 'react'

import css from '../../css-modules/share-dialog.less'

function getURL () {
  return window.location.href
}

function getIframeString () {
  return `<iframe width='1000px' height='800px' frameborder='no' scrolling='no' allowfullscreen='true' src='${getURL()}'></iframe>`
}

export default class ShareDialogContent extends PureComponent {
  render () {
    return (
      <div>
        <p>
          Paste this link in email or IM.
          <textarea id='page-url' value={getURL()} readOnly />
        </p>
        <p>
          Paste HTML to embed in website or blog.
          <textarea id='iframe-string' value={getIframeString()} readOnly style={{height: '4em'}} />
        </p>
        <div className={css.copyright}>
          <b>Copyright © 2018</b> <a href='http://concord.org' target='_blank'>The Concord Consortium</a>. All rights
          reserved. The software is licensed under the <a href='http://opensource.org/licenses/MIT' target='_blank'>MIT</a> license.
          Please provide attribution to the Concord Consortium and the URL <a href='http://concord.org' target='_blank'>http://concord.org</a>.
        </div>
      </div>
    )
  }
}
