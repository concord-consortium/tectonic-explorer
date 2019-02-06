import React, { PureComponent } from 'react'
import { inject, observer } from 'mobx-react'
import { CSSTransitionGroup } from 'react-transition-group'
import SmallButton from './small-button'
import CrossSection2D from './cross-section-2d'
import CrossSection3D from './cross-section-3d'
import config from '../config'
import { OCEANIC_CRUST_COL, CONTINENTAL_CRUST_COL, LITHOSPHERE_COL, MANTLE_COL, OCEAN_COL, SKY_COL_1, SKY_COL_2 } from '../plates-view/render-cross-section'

import '../../css/cross-section.less'

export const CROSS_SECTION_TRANSITION_LENGTH = 400 // ms

function rect (color1, color2) {
  let colorDef = color1
  if (color2) {
    colorDef = `linear-gradient(${color1}, ${color2})`
  }
  return <div className='rect' style={{background: colorDef}} />
}

@inject('simulationStore') @observer
export default class CrossSection extends PureComponent {
  render () {
    const { crossSectionVisible, closeCrossSection } = this.props.simulationStore
    return (
      <div className='cross-section' data-test='cross-section'>
        <CSSTransitionGroup
          transitionName='slide'
          transitionEnterTimeout={CROSS_SECTION_TRANSITION_LENGTH}
          transitionLeaveTimeout={CROSS_SECTION_TRANSITION_LENGTH}>
          {
            crossSectionVisible &&
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
              <dic className='container'>
                { config.crossSection3d ? <CrossSection3D /> : <CrossSection2D /> }
                <SmallButton className='close-button' icon='close' onClick={closeCrossSection} data-test='cross-section-close'>
                  Close cross-section
                </SmallButton>
              </dic>
            </div>
          }
        </CSSTransitionGroup>
      </div>
    )
  }
}
