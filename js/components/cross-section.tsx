import React from "react";
import { inject, observer } from "mobx-react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import SmallButton from "./small-button";
import CrossSection3D from "./cross-section-3d";
import { BaseComponent, IBaseProps } from "./base";

import "../../css/cross-section.less";

export const CROSS_SECTION_TRANSITION_LENGTH = 400; // ms

interface IState {}

@inject("simulationStore")
@observer
export default class CrossSection extends BaseComponent<IBaseProps, IState> {
  render() {
    const { crossSectionVisible, closeCrossSection } = this.simulationStore;
    return (
      <div className="cross-section" data-test="cross-section">
        <TransitionGroup>
          { crossSectionVisible &&
            <CSSTransition classNames="slide" timeout={{ exit: CROSS_SECTION_TRANSITION_LENGTH, enter: CROSS_SECTION_TRANSITION_LENGTH }}>
              <div key="cross-section" className="cross-section-content">
                <div className="container">
                  <CrossSection3D />
                  <SmallButton className="close-button" icon="close" onClick={closeCrossSection} data-test="cross-section-close">
                    Close Cross-section
                  </SmallButton>
                </div>
              </div>
            </CSSTransition>
          }
        </TransitionGroup>
      </div>
    );
  }
}
