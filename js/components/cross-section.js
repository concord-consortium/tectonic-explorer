import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import SmallButton from './small-button'
import CrossSection2D from './cross-section-2d'
import CrossSection3D from './cross-section-3d'
import config from '../config'

import '../../css/cross-section.less'

export const CROSS_SECTION_TRANSITION_LENGTH = 400 // ms

export default @inject('simulationStore') @observer class CrossSection extends Component {
  render () {
    const { crossSectionVisible, closeCrossSection } = this.props.simulationStore
    return (
      <div className='cross-section' data-test='cross-section'>
        <TransitionGroup>
          {
            crossSectionVisible &&
            <CSSTransition
              classNames='slide'
              timeout={{ exit: CROSS_SECTION_TRANSITION_LENGTH, enter: CROSS_SECTION_TRANSITION_LENGTH }}
            >
              <div key='cross-section' className='cross-section-content'>
                <div className='container'>
                  { config.crossSection3d ? <CrossSection3D /> : <CrossSection2D /> }
                  <SmallButton className='close-button' icon='close' onClick={closeCrossSection} data-test='cross-section-close'>
                    Close cross-section
                  </SmallButton>
                </div>
              </div>
            </CSSTransition>
          }
        </TransitionGroup>
      </div>
    )
  }
}
