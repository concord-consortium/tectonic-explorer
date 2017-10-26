import React, { PureComponent } from 'react'
import { Button } from 'react-toolbox/lib/button'
import { CSSTransitionGroup } from 'react-transition-group'
import FontIcon from 'react-toolbox/lib/font_icon'
import CrossSection2D from './cross-section-2d'
import CrossSection3D from './cross-section-3d'
import config from '../config'

import '../../css/cross-section.less'

export const CROSS_SECTION_TRANSITION_LENGTH = 400 // ms

export default class CrossSection extends PureComponent {
  render () {
    const { show, onCrossSectionClose, data, swapped } = this.props
    return (
      <div className='cross-section'>
        <CSSTransitionGroup
          transitionName='slide'
          transitionEnterTimeout={CROSS_SECTION_TRANSITION_LENGTH}
          transitionLeaveTimeout={CROSS_SECTION_TRANSITION_LENGTH}>
          {
            show &&
            <div key='cross-section' className='cross-section-content'>
              <Button className='close-button' onClick={onCrossSectionClose} >
                <FontIcon value='expand_more' /> Hide cross section
              </Button>
              <dic className='container'>
                { config.crossSection3d
                  ? <CrossSection3D data={data} swapped={swapped} /> : <CrossSection2D data={data.dataFront} swapped={swapped} />
                }
              </dic>
            </div>
          }
        </CSSTransitionGroup>
      </div>
    )
  }
}
