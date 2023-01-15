import React from "react";
import { autorun } from "mobx";
import { inject, observer } from "mobx-react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import CrossSection3DView from "../plates-view/cross-section-3d";
import { BaseComponent, IBaseProps } from "./base";
import { SimulationStore } from "../stores/simulation-store";
import CrossSectionInteractionsManager from "../plates-interactions/cross-section-interactions-manager";

import "../../css/cross-section-3d.less";

interface IState {}

export interface IOnCreateSceneParams {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
}

interface IProps extends IBaseProps {
  onCreateScene: (params: IOnCreateSceneParams) => void;
}
@inject("simulationStore")
@observer
export default class CrossSection3D extends BaseComponent<IProps, IState> {
  disposeObserver: any;
  view: CrossSection3DView;
  interactions: CrossSectionInteractionsManager;
  view3dContainer: any;

  constructor(props: IProps) {
    super(props);
    const store = props.simulationStore as SimulationStore;
    this.view = new CrossSection3DView(store.setCrossSectionCameraAngleAndZoom);
    props.onCreateScene?.({ scene: this.view.scene, camera: this.view.camera, controls: this.view.controls });
    this.interactions = new CrossSectionInteractionsManager(this.view, store);
    this.disposeObserver = [];
    // Keep observers separate, as we don't want to re-render the whole cross-section each time the camera angle is changed.
    this.disposeObserver.push(autorun(() => {
      this.view.setScreenWidth(store.screenWidth);
      this.view.setCrossSectionData(store.crossSectionOutput, store.crossSectionDataSamples, store.crossSectionSwapped, {
        rockLayers: store.rockLayers,
        metamorphism: store.metamorphism
      });
    }));
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraAngleAndZoom(store.crossSectionCameraAngle, store.crossSectionCameraZoom);
    }));
    this.disposeObserver.push(autorun(() => {
      this.view.setCameraLocked(store.crossSectionCameraAnimating || store.interaction === "collectData");
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
    const { interaction, key } = this.simulationStore;
    return (
      <div className={`cross-section-3d-view ${interaction} ${key ? "narrow" : ""}`} data-test="3D-view">
        <div ref={(c) => this.view3dContainer = c} />
      </div>
    );
  }
}
