import React from "react";
import { inject, observer } from "mobx-react";
import screenfull from "screenfull";
import { ControlGroup } from "./control-group";
import { PlayPauseButton, ReloadButton, RestartButton, StepBackButton, StepForwardButton } from "./vcr-buttons";
import ccLogo from "../assets/cc-logo.png";
import ccLogoSmall from "../assets/cc-logo-small.png";
import { IconHighlightButton } from "./icon-highlight-button";
import { MapTypeButton } from "./map-type-button";
import { SliderSwitch } from "./slider-switch";
import config, { Colormap } from "../config";
import DrawCrossSectionIconSVG from "../assets/draw-cross-section-icon.svg";
import PressureIconControlSVG from "../assets/pressure-icon-control.svg";
import TemperatureIconControlSVG from "../assets/temp-icon-control.svg";
import TakeSampleIconControlSVG from "../assets/take-sample-icon-control.svg";
import PointyPinOutlineClickedSVG from "../assets/pointy-pin-outline-clicked.svg";
import { IGlobeInteractionName } from "../plates-interactions/globe-interactions-manager";
import { BaseComponent, IBaseProps } from "./base";
import { ICrossSectionInteractionName } from "../plates-interactions/cross-section-interactions-manager";
import { log, LogEvent } from "../log";

import "./bottom-panel.global.scss";

function toggleFullscreen() {
  if (screenfull.isEnabled) {
    if (!screenfull.isFullscreen) {
      screenfull.request();
    } else {
      screenfull.exit();
    }
  }
}

interface IState {
  fullscreen: boolean;
  width: number;
}

@inject("simulationStore")
@observer
export default class BottomPanel extends BaseComponent<IBaseProps, IState> {
  constructor(props: IBaseProps) {
    super(props);
    this.state = {
      fullscreen: false,
      width: 0
    };
  }

  componentDidMount() {
    if (screenfull.isEnabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  componentWillUnmount() {
    if (screenfull.isEnabled) {
      document.removeEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  get options() {
    return this.simulationStore;
  }

  get playPauseIcon() {
    return this.options.playing ? "pause" : "play_arrow";
  }

  get playPauseLabel() {
    return this.options.playing ? "Stop" : "Start";
  }

  get fullscreenIconStyle() {
    return this.state.fullscreen ? "fullscreen-icon fullscreen" : "fullscreen-icon";
  }

  fullscreenChange = () => {
    const fullscreen = screenfull.isEnabled && screenfull.isFullscreen;
    this.setState({ fullscreen });
    log({ action: fullscreen ? "FullScreenEnabled" : "FullScreenDisabled" });
  };

  togglePlayPause = () => {
    const { setOption } = this.simulationStore;
    const newState = !this.options.playing;
    setOption("playing", newState);
    log({ action: newState ? "SimulationStarted" : "SimulationStopped" });
  };

  setShowEarthquakes = (on: boolean) => {
    this.simulationStore.setEarthquakesVisible(on);
    log({ action: on ? "EarthquakesVisible" : "EarthquakesHidden" });
  };

  setShowVolcanicEruptions = (on: boolean) => {
    this.simulationStore.setVolcanicEruptionsVisible(on);
    log({ action: on ? "VolcanicEruptionsVisible" : "VolcanicEruptionsHidden" });
  };

  toggleInteraction = (interaction: IGlobeInteractionName | ICrossSectionInteractionName) => {
    const { setInteraction, interaction: currentInteraction } = this.simulationStore;
    const isDisabling = currentInteraction === interaction;
    const enableInteractionEvents: Partial<Record<IGlobeInteractionName | ICrossSectionInteractionName, LogEvent>> = {
      "crossSection": { action: "CrossSectionDrawingEnabled" },
      "measureTempPressure": { action: "MeasureTempPressureEnabled" },
      "takeRockSample": { action: "RockPickerEnabled" },
    };
    const enableEvent = enableInteractionEvents[interaction];
    const disableInteractionEvents: Partial<Record<IGlobeInteractionName | ICrossSectionInteractionName, LogEvent>> = {
      "crossSection": { action: "CrossSectionDrawingDisabled" },
      "measureTempPressure": { action: "MeasureTempPressureDisabled" },
      "takeRockSample": { action: "RockPickerDisabled" },
    };
    // log the disabling of the current interaction (if any)
    const disableEvent = disableInteractionEvents[currentInteraction as IGlobeInteractionName | ICrossSectionInteractionName];
    disableEvent && log(disableEvent);

    // enable/disable the new interaction
    setInteraction(isDisabling ? "none" : interaction);

    // log the enabling of the new interaction (if any)
    !isDisabling && enableEvent && log(enableEvent);

    // just log the change for other interactions
    if (!enableEvent || !disableEvent) {
      log({ action: "InteractionUpdated", data: { value: interaction } });
    }
  };

  handleDataCollectionToggle = () => {
    if (this.simulationStore.interaction !== "collectData") {
      if (this.simulationStore.interactiveState && this.simulationStore.interactiveState.dataSamples.length > 0) {
        this.simulationStore.showEnterDataCollectionDialog();
        log({ action: "EnterDataCollectionDialogOpened" });
      } else {
        // No previously saved data, turn on data collection mode immediately.
        this.simulationStore.setInteraction("collectData");
        log({ action: "DataCollectionEnabled" });
      }
    } else {
      if (this.simulationStore.dataSamples.length > 0) {
        // Data samples exist, show exit data collection dialog.
        this.simulationStore.showExitDataCollectionDialog();
        log({ action: "ExitDataCollectionDialogOpened" });
      } else {
        // No data samples, exit data collection mode immediately.
        this.simulationStore.setInteraction("none");
        log({ action: "DataCollectionDisabled" });
      }
    }
  };

  render() {
    const {
      showDrawCrossSectionButton, showTempPressureTool, showTakeSampleButton, showCollectDataButton, showEarthquakesSwitch, showVolcanoesSwitch
    } = config;
    const { interaction, colormap, showCrossSectionView, currentDataSample } = this.simulationStore;
    const { reload, restoreSnapshot, restoreInitialSnapshot, stepForward, simulationDisabled } = this.simulationStore;
    const options = this.options;
    const isDrawingCrossSection = interaction === "crossSection";
    const isMeasuringTempPressure = interaction === "measureTempPressure";
    const isTakingRockSample = interaction === "takeRockSample";
    const isCollectingData = interaction === "collectData";
    const showEventsGroup = showEarthquakesSwitch || showVolcanoesSwitch;

    const setColorMap = (colorMap: Colormap) => {
      this.simulationStore.setOption("colormap", colorMap);
      log({ action: "MapTypeUpdated", data: { value: colorMap } });
    };

    return (
      <div className="bottom-panel">
        <img src={ccLogo} className="cc-logo-large" data-test="cc-logo-large" />
        <img src={ccLogoSmall} className="cc-logo-small" data-test="cc-logo-small" />
        <div className="middle-widgets">
          { config.colormapOptions?.length > 1 &&
            <ControlGroup>
              <MapTypeButton colorMap={colormap} onSetColorMap={setColorMap} />
            </ControlGroup> }
          { showDrawCrossSectionButton &&
            <ControlGroup>
              <IconHighlightButton active={isDrawingCrossSection} disabled={isCollectingData} data-test="draw-cross-section"
                style={{ width: 92 }} label={<>Draw<br/>Cross-section</>} Icon={DrawCrossSectionIconSVG}
                onClick={() => this.toggleInteraction("crossSection")} />
            </ControlGroup> }
          <ControlGroup>
            <div className="buttons">
              { config.planetWizard && <ReloadButton onClick={reload} data-test="reload-button" /> }
              <RestartButton disabled={!options.snapshotAvailable || isCollectingData} onClick={restoreInitialSnapshot} data-test="restart-button" />
              <StepBackButton disabled={!options.snapshotAvailable || isCollectingData} onClick={restoreSnapshot} data-test="step-back-button" />
              <PlayPauseButton disabled={simulationDisabled || isCollectingData} isPlaying={options.playing} onClick={this.togglePlayPause} data-test="playPause-button" />
              <StepForwardButton disabled={simulationDisabled || options.playing || isCollectingData} onClick={stepForward} data-test="step-forward-button" />
            </div>
          </ControlGroup>
          { !config.geode && (showTempPressureTool || showTakeSampleButton) &&
            <ControlGroup hideBubble={true}>
              <div className="interactive-tools">
                { showTempPressureTool &&
                  <ControlGroup>
                    <IconHighlightButton active={isMeasuringTempPressure} disabled={!showCrossSectionView || isCollectingData} style={{ width: 110 }}
                      label={<>Measure<br/>Temp/Pressure</>} Icon={TemperatureIconControlSVG} Icon2={PressureIconControlSVG}
                      onClick={() => this.toggleInteraction("measureTempPressure")} data-test="measure-temp-pressure" />
                  </ControlGroup> }
                { showTakeSampleButton &&
                  <ControlGroup>
                    <IconHighlightButton active={isTakingRockSample} disabled={isCollectingData} style={{ width: 64 }} data-test="take-sample"
                      label={<>Take<br/>Sample</>} Icon={TakeSampleIconControlSVG}
                      onClick={() => this.toggleInteraction("takeRockSample")} />
                  </ControlGroup> }
                { showCollectDataButton &&
                  <ControlGroup>
                    <IconHighlightButton active={isCollectingData} disabled={!showCrossSectionView || !!currentDataSample} style={{ width: 64 }} data-test="collect-data"
                      label={<>Collect<br/>Data</>} Icon={PointyPinOutlineClickedSVG}
                      onClick={this.handleDataCollectionToggle} />
                  </ControlGroup> }
              </div>
            </ControlGroup> }
          { showEventsGroup &&
            <ControlGroup>
              <div className="event-buttons">
                { showVolcanoesSwitch &&
                  <SliderSwitch label="Volcanoes"
                    isOn={this.simulationStore.volcanicEruptions} onSet={this.setShowVolcanicEruptions}/> }
                { showEarthquakesSwitch &&
                  <SliderSwitch label="Earthquakes"
                    isOn={this.simulationStore.earthquakes} onSet={this.setShowEarthquakes}/> }
              </div>
            </ControlGroup> }
        </div>
        <div className="right-widgets">
          {
            screenfull.isEnabled &&
            <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title="Toggle Fullscreen" data-test="fullscreen-button" />
          }
        </div>
      </div>
    );
  }
}
