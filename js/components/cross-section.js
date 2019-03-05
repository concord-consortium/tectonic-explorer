import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import SmallButton from './small-button'
import CrossSection2D from './cross-section-2d'
import CrossSection3D from './cross-section-3d'
import config from '../config'
import { OCEANIC_CRUST_COL, CONTINENTAL_CRUST_COL, LITHOSPHERE_COL, MANTLE_COL, OCEAN_COL, SKY_COL_1, SKY_COL_2 } from '../cross-section-colors'

import '../../css/cross-section.less'

export const CROSS_SECTION_TRANSITION_LENGTH = 400 // ms

function rect (color1, color2) {
  let colorDef = color1
  if (color2) {
    colorDef = `linear-gradient(${color1}, ${color2})`
  }
  return <div className='rect' style={{ background: colorDef }} />
}

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
                <table className='key' data-test='cross-section-key'>
                  <tbody>
                    <tr><td>{rect(SKY_COL_1, SKY_COL_2)}</td><td>Sky</td></tr>
                    <tr><td>{rect(CONTINENTAL_CRUST_COL)}</td><td>Continental crust</td></tr>
                    <tr><td>{rect(OCEAN_COL)}</td><td>Ocean</td></tr>
                    <tr><td>{rect(OCEANIC_CRUST_COL)}</td><td>Oceanic crust</td></tr>
                    <tr><td>{rect(LITHOSPHERE_COL)}</td><td>Lithosphere</td></tr>
                    <tr><td>{rect(MANTLE_COL)}</td><td>Mantle</td></tr>
                  </tbody>
                </table>
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
