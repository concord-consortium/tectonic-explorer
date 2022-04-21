import React from "react";
import { autorun } from "mobx";
import { inject, observer } from "mobx-react";
import CrossSection3DView from "../plates-view/cross-section-3d";
import SmallButton from "./small-button";
import { BaseComponent, IBaseProps } from "./base";
import { SimulationStore } from "../stores/simulation-store";
import CrossSectionInteractionsManager from "../plates-interactions/cross-section-interactions-manager";

import "../../css/cross-section-3d.less";

interface IState {}

@inject("simulationStore")
@observer
export default class CrossSection3D extends BaseComponent<IBaseProps, IState> {
  disposeObserver: any;
  view: CrossSection3DView;
  interactions: CrossSectionInteractionsManager;
  view3dContainer: any;

  constructor(props: IBaseProps) {
    super(props);
    const store = props.simulationStore as SimulationStore;
    this.view = new CrossSection3DView(store.setCrossSectionCameraAngle);
    this.interactions = new CrossSectionInteractionsManager(this.view, store);
    this.disposeObserver = [];
    // Keep observers separate, as we don't want to re-render the whole cross-section each time the camera angle is changed.
    this.disposeObserver.push(autorun(() => {
      this.view.setScreenWidth(store.screenWidth);
      this.view.setCrossSectionData(store.crossSectionOutput, store.crossSectionSwapped, {
        rockLayers: store.rockLayers,
        metamorphism: store.metamorphism
      });
    }));
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraAngle(store.crossSectionCameraAngle);
    }));
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraLocked(store.crossSectionCameraAnimating);
    }));
    // Observe changes to store properties and update interactions helper.
    this.disposeObserver.push(autorun(() => {
      this.interactions.setInteraction(store.interaction);
      this.interactions.setScreenWidth(store.screenWidth);
    }));
  }

  componentDidMount() {
    this.view3dContainer.appendChild(this.view.domElement);
  }

  componentWillUnmount() {
    this.view.dispose();
    this.disposeObserver.forEach((dispose: any) => dispose());
    this.interactions.disableEventHandlers();
  }

  render() {
    const { showCrossSectionCameraReset, resetCrossSectionCamera, interaction, key } = this.simulationStore;
    return (
      <div className={`cross-section-3d-view ${interaction} ${key ? "narrow" : ""}`} data-test="3D-view">
        <div ref={(c) => this.view3dContainer = c} />
        {
          showCrossSectionCameraReset &&
          <SmallButton className="cross-section-camera-reset" onClick={resetCrossSectionCamera} icon="settings_backup_restore" data-test="camera-reset">
            Reset Cross-section<br />Orientation
          </SmallButton>
        }
      </div>
    );
  }
}
