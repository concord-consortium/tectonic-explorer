import React, { PureComponent } from 'react'

export default class Copyright extends PureComponent {
  render () {
    return (
      <div>
        <b>Copyright © {(new Date()).getFullYear()}</b> <a href='http://concord.org' target='_blank'>The Concord Consortium</a>.
        All rights reserved. The software is licensed under
        the <a href='https://github.com/concord-consortium/tectonic-explorer/blob/master/LICENSE' target='_blank'>MIT</a> license.
        The content is licensed under a <a href='https://creativecommons.org/licenses/by/4.0/' target='_blank'>Creative Commons Attribution 4.0 International License</a>.
        Please provide attribution to the Concord Consortium and the URL <a href='http://concord.org' target='_blank'>http://concord.org</a>.
      </div>
    )
  }
}
