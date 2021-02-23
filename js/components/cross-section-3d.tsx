import React, { Component } from "react";
import { autorun } from "mobx";
import { inject, observer } from "mobx-react";
import CrossSection3DView from "../plates-view/cross-section-3d";
import SmallButton from "./small-button";

import "../../css/cross-section-3d.less";

@inject("simulationStore")
@observer
export default class CrossSection3D extends Component {
  disposeObserver: any;
  view: any;
  view3dContainer: any;

  constructor(props: any) {
    super(props);
    this.view = new CrossSection3DView(props.simulationStore.setCrossSectionCameraAngle);
    this.disposeObserver = [];
    const store = props.simulationStore;
    // Keep observers separate, as we don't want to re-render the whole cross-section each time the camera angle is changed.
    this.disposeObserver.push(autorun(() => {
      this.view.setScreenWidth(store.screenWidth);
      this.view.setCrossSectionData(store.crossSectionOutput, store.crossSectionSwapped);
    }));
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraAngle(store.crossSectionCameraAngle);
    }));
  }

  componentDidMount() {
    this.view3dContainer.appendChild(this.view.domElement);
  }

  componentWillUnmount() {
    this.view.dispose();
    this.disposeObserver.forEach((dispose: any) => dispose());
  }

  render() {
    const { showCrossSectionCameraReset, resetCrossSectionCamera } = (this.props as any).simulationStore;
    return (
      <div className="cross-section-3d-view" data-test="3D-view">
        <div ref={(c) => {
          this.view3dContainer = c;
        }} />
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
