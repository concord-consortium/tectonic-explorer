import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'

import '../../css/interaction-selector.less'

const ICON = {
  'none': '3d_rotation',
  'crossSection': 'border_color',
  'drawContinent': 'blur_on',
  'eraseContinent': 'blur_off',
  'force': 'compare_arrows'
}

const LABEL = {
  'none': 'Rotate camera',
  'crossSection': 'Draw cross section',
  'drawContinent': 'Draw continents',
  'eraseContinent': 'Erase continents',
  'force': 'Draw force vectors'
}

export default class InteractionSelector extends PureComponent {
  renderInteractionButton (targetInteraction) {
    const { currentInteraction, onInteractionChange } = this.props
    const activeClass = targetInteraction === currentInteraction ? 'active' : ''
    const handler = () => { onInteractionChange(targetInteraction) }
    return (
      <Button key={targetInteraction} className={`large-button ${activeClass}`} onClick={handler}>
        <FontIcon value={ICON[targetInteraction]} />
        <div className='label'>{LABEL[targetInteraction]}</div>
      </Button>
    )
  }

  render () {
    const { interactions } = this.props
    return (
      <div className='interaction-selector'>
        { interactions.map(name => this.renderInteractionButton(name)) }
      </div>
    )
  }
}
