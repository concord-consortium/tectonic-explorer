import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import { Button } from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'

import '../../css/interaction-selector.less'

const ICON = {
  'none': '3d_rotation',
  'crossSection': 'border_color',
  'continentDrawing': 'blur_on',
  'continentErasing': 'blur_off',
  'force': 'vertical_align_center'
}

export const INTRERACTION_LABELS = {
  'none': 'Rotate camera',
  'crossSection': 'Draw cross section',
  'continentDrawing': 'Draw continents',
  'continentErasing': 'Erase continents',
  'force': 'Draw force vectors'
}

@inject('simulationStore') @observer
export default class InteractionSelector extends PureComponent {
  renderInteractionButton (targetInteraction) {
    const { interaction, setInteraction } = this.props.simulationStore
    const activeClass = targetInteraction === interaction ? 'active' : ''
    const handler = () => { setInteraction(targetInteraction) }
    return (
      <Button key={targetInteraction} className={`large-button ${activeClass}`}
      data-test={INTRERACTION_LABELS[targetInteraction]} onClick={handler}>
        <FontIcon value={ICON[targetInteraction]} />
        <div className='label'>{INTRERACTION_LABELS[targetInteraction]}</div>
      </Button>
    )
  }

  render () {
    const { selectableInteractions } = this.props.simulationStore
    return (
      <div className='interaction-selector' data-test='interaction-selector'>
        { selectableInteractions.map(name => this.renderInteractionButton(name)) }
      </div>
    )
  }
}
