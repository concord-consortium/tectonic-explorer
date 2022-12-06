import React from "react";
import { inject, observer } from "mobx-react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import CrossSection3D, { IOnCreateSceneParams } from "./cross-section-3d";
import { BaseComponent, IBaseProps } from "./base";
import { log } from "../log";
import { CAMERA_ZOOM_STEP, MAX_CAMERA_ZOOM, MIN_CAMERA_ZOOM } from "../types";
import ModelCloseIconSVG from "../../images/model-close-icon.svg";
import ModelResetIconSVG from "../../images/model-reset-icon.svg";
import ZoomInIconSVG from "../../images/zoom-in-icon.svg";
import ZoomOutIconSVG from "../../images/zoom-out-icon.svg";

import "../../css/cross-section.less";

export const CROSS_SECTION_TRANSITION_LENGTH = 400; // ms

interface IState {}

@inject("simulationStore")
@observer
export default class CrossSection extends BaseComponent<IBaseProps, IState> {
  camera: THREE.OrthographicCamera;

  handleCreateScene = (params: IOnCreateSceneParams) => {
    this.camera = params.camera;
  };

  handleZoomIn = () => {
    const { crossSectionCameraAngle, setCrossSectionCameraAngleAndZoom } = this.simulationStore;
    const zoom = Math.min(MAX_CAMERA_ZOOM, this.camera.zoom + CAMERA_ZOOM_STEP);
    setCrossSectionCameraAngleAndZoom(crossSectionCameraAngle, zoom);
    log({ action: "CrossSectionZoomInClicked" });
  };

  handleZoomOut = () => {
    const { crossSectionCameraAngle, setCrossSectionCameraAngleAndZoom } = this.simulationStore;
    const zoom = Math.max(MIN_CAMERA_ZOOM, this.camera.zoom - CAMERA_ZOOM_STEP);
    setCrossSectionCameraAngleAndZoom(crossSectionCameraAngle, zoom);
    log({ action: "CrossSectionZoomOutClicked" });
  };

  handleResetCamera = () => {
    this.simulationStore.resetCrossSectionCamera();
  };

  render() {
    const { crossSectionVisible, showCrossSectionCameraReset, closeCrossSection, interaction } = this.simulationStore;
    const isCollectingData = interaction === "collectData";

    return (
      <div className="cross-section" data-test="cross-section">
        <TransitionGroup>
          { crossSectionVisible &&
            <CSSTransition classNames="slide" timeout={{ exit: CROSS_SECTION_TRANSITION_LENGTH, enter: CROSS_SECTION_TRANSITION_LENGTH }}>
              <div key="cross-section" className="cross-section-content">
                <div className="container">
                  <CrossSection3D onCreateScene={this.handleCreateScene}/>
                  <CrossSectionControls showResetCamera={showCrossSectionCameraReset} onClose={isCollectingData ? undefined : closeCrossSection}
                    onZoomIn={this.handleZoomIn} onZoomOut={this.handleZoomOut} onResetCamera={this.handleResetCamera} />
                </div>
              </div>
            </CSSTransition>
          }
        </TransitionGroup>
      </div>
    );
  }
}

interface ICrossSectionControlsProps {
  showResetCamera: boolean;
  onClose?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
}
const CrossSectionControls = ({ showResetCamera, onClose, onZoomIn, onZoomOut, onResetCamera }: ICrossSectionControlsProps) => {
  return (
    <div className="cross-section-controls">
      <div className="cross-section-controls-title">Cross-section</div>
      { onClose && <CrossSectionButton Icon={ModelCloseIconSVG} tooltip="Close" onClick={onClose} /> }
      <CrossSectionButton Icon={ZoomInIconSVG} tooltip="Zoom In" onClick={onZoomIn} />
      <CrossSectionButton Icon={ZoomOutIconSVG} tooltip="Zoom Out" onClick={onZoomOut} />
      { showResetCamera &&
        <CrossSectionButton Icon={ModelResetIconSVG} tooltip="Reset View" onClick={onResetCamera} /> }
    </div>
  );
};

interface ICrossSectionButtonProps {
  Icon: any;
  tooltip: string;
  onClick: () => void;
}
const CrossSectionButton = ({ Icon, tooltip, onClick }: ICrossSectionButtonProps) => {
  // convert tooltip to kebab-cased class
  const className = tooltip.toLowerCase().replace(/\s/g, "-");
  return (
    <div className={`cross-section-button ${className}`} title={tooltip} onClick={onClick}>
      <Icon/>
    </div>
  );
};
