import React from "react";
import { autorun } from "mobx";
import { inject, observer } from "mobx-react";
import Caveat from "./caveat-notice";
import InteractionSelector from "./interaction-selector";
import SmallButton from "./small-button";
import GlobeInteractionsManager from "../plates-interactions/globe-interactions-manager";
import { IPlanetClickData } from "../plates-interactions/planet-click";
import CanvasPlanetView from "../plates-view/planet-view";
import TimeDisplay from "./time-display";
import { CROSS_SECTION_TRANSITION_LENGTH } from "./cross-section";
import { BaseComponent, IBaseProps } from "./base";
import config from "../config";

interface IState {}

// Main component that orchestrates simulation progress and view updates.
@inject("simulationStore")
@observer
export default class PlanetView extends BaseComponent<IBaseProps, IState> {
  disposeObserver: any;
  interactions: GlobeInteractionsManager;
  view3d: CanvasPlanetView;
  view3dContainer: any;

  constructor(props: any) {
    super(props);
    this.disposeObserver = [];
    // 3D rendering.
    this.view3d = new CanvasPlanetView(props.simulationStore);
    // User interactions, e.g. cross-section drawing, force assignment and so on.
    this.interactions = new GlobeInteractionsManager(this.view3d);
    this.setupInteractions();
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.view3dContainer.appendChild(this.view3d.domElement);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    // Safari layout issue workaround. For some reason it's necessary to call resize function again.
    // Otherwise, the main 3D view won't fill up the whole available height.
    setTimeout(this.handleResize, 100);
  }

  componentDidUpdate() {
    setTimeout(this.handleResize, CROSS_SECTION_TRANSITION_LENGTH);
  }

  componentWillUnmount() {
    this.view3d.dispose();
    window.removeEventListener("resize", this.handleResize);
    this.disposeObserver.forEach((dispose: any) => dispose());
    this.interactions.disableEventHandlers();
  }

  handleResize() {
    this.view3d.resize(this.view3dContainer);
    const padding = 20;
    this.simulationStore.setScreenWidth(window.innerWidth - padding);
  }

  setupInteractions() {
    const { simulationStore } = this.props;
    // Observe changes to store properties and update interactions helper.
    this.disposeObserver.push(autorun(() => {
      this.interactions.setInteraction(simulationStore?.interaction || "none");
      this.interactions.setScreenWidth(simulationStore?.screenWidth || 0);
    }));
    this.interactions.on("crossSectionDrawing", (data: any) => {
      simulationStore?.setCrossSectionPoints(data.point1, data.point2);
    });
    this.interactions.on("crossSectionDrawingEnd", (data: any) => {
      simulationStore?.showCrossSection();
    });
    this.interactions.on("forceDrawing", (data: any) => {
      simulationStore?.setCurrentHotSpot(data.position, data.force);
    });
    this.interactions.on("forceDrawingEnd", (data: any) => {
      simulationStore?.setHotSpot(data);
    });
    this.interactions.on("markField", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.markField(globePosition);
    });
    this.interactions.on("fieldInfo", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.getFieldInfo(globePosition);
    });
    this.interactions.on("assignBoundary", ({ globePosition, screenPosition }: IPlanetClickData) => {
      // make sure the appropriate segment is highlighted
      simulationStore?.highlightBoundarySegment(globePosition);
      simulationStore?.setSelectedBoundary(screenPosition);
    });
    this.interactions.on("takeRockSampleFromSurface", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.takeRockSampleFromSurface(globePosition);
      simulationStore?.setSelectedRockFlash(true);
    });
    this.interactions.on("continentDrawing", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.drawContinent(globePosition);
    });
    this.interactions.on("continentDrawingEnd", () => {
      simulationStore?.markIslands();
    });
    this.interactions.on("continentErasing", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.eraseContinent(globePosition);
    });
    this.interactions.on("continentErasingEnd", () => {
      simulationStore?.markIslands();
    });
    this.interactions.on("highlightBoundarySegment", ({ globePosition }: IPlanetClickData) => {
      simulationStore?.highlightBoundarySegment(globePosition);
    });
  }

  render() {
    const { showPlanetCameraReset, resetPlanetCamera, crossSectionVisible } = this.simulationStore;
    return (
      <div className={`planet-view ${crossSectionVisible ? "small" : "full"}`} ref={(c) => {
        this.view3dContainer = c;
      }}>
        <Caveat />
        <InteractionSelector />
        { config.timeCounter && <TimeDisplay /> }
        {
          showPlanetCameraReset &&
          <SmallButton className="camera-reset" onClick={resetPlanetCamera} icon="settings_backup_restore" data-test="reset-camera">
            Reset Planet<br />Orientation
          </SmallButton>
        }
      </div>
    );
  }
}
