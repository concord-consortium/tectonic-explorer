import { log as laraLog } from "@concord-consortium/lara-interactive-api";
import { Colormap } from "./config";
import { ICrossSectionInteractionName } from "./plates-interactions/cross-section-interactions-manager";
import { IGlobeInteractionName } from "./plates-interactions/globe-interactions-manager";
import { BoundaryType, IDataSample, RockKeyLabel, TabName } from "./types";

type SimulationStarted =  { action: "SimulationStarted", data?: undefined };
type SimulationStopped = { action: "SimulationStopped", data?: undefined };
type SimulationReloaded = { action: "SimulationReloaded", data?: undefined };
type SimulationReset = { action: "SimulationReset", data?: undefined };
type SimulationStepForward = { action: "SimulationStepForward", data?: undefined };
type SimulationStepBack = { action: "SimulationStepBack", data?: undefined };
type EarthquakesVisible = { action: "EarthquakesVisible", data?: undefined };
type EarthquakesHidden = { action: "EarthquakesHidden", data?: undefined };
type VolcanicEruptionsVisible = { action: "VolcanicEruptionsVisible", data?: undefined };
type VolcanicEruptionsHidden = { action: "VolcanicEruptionsHidden", data?: undefined };
// Colormap: "topo" | "plate" | "age" | "rock"
type MapTypeUpdated = { action: "MapTypeUpdated", data?: { value: Colormap }};
type CrossSectionDrawingEnabled = { action: "CrossSectionDrawingEnabled", data?: undefined };
type CrossSectionDrawingDisabled = { action: "CrossSectionDrawingDisabled", data?: undefined };
type MeasureTempPressureEnabled = { action: "MeasureTempPressureEnabled", data?: undefined };
type MeasureTempPressureDisabled = { action: "MeasureTempPressureDisabled", data?: undefined };
type RockPickerEnabled = { action: "RockPickerEnabled", data?: undefined };
type RockPickerDisabled = { action: "RockPickerDisabled", data?: undefined };
// Data collection events
type DataCollectionEnabled = { action: "DataCollectionEnabled", data?: undefined };
type DataCollectionDisabled = { action: "DataCollectionDisabled", data?: undefined };
type ExitDataCollectionDialogOpened = { action: "ExitDataCollectionDialogOpened", data?: undefined };
type ExitDataCollectionDialogContinueClicked = { action: "ExitDataCollectionDialogContinueClicked", data?: undefined };
type ExitDataCollectionDialogSaveAndExitClicked = { action: "ExitDataCollectionDialogSaveAndExitClicked", data?: undefined };
type DataCollectionDialogSubmitClicked = { action: "DataCollectionDialogSubmitClicked", data: IDataSample };
type DataCollectionDialogDiscardClicked = { action: "DataCollectionDialogDiscardClicked", data?: undefined };
type CrossSectionDataSamplePlaced = { action: "CrossSectionDataSamplePlaced", data: IDataSample };
type EnterDataCollectionDialogOpened = { action: "EnterDataCollectionDialogOpened", data?: undefined };
type EnterDataCollectionDialogCancelClicked = { action: "EnterDataCollectionDialogCancelClicked", data?: undefined };
type EnterDataCollectionDialogEraseAndStartOverClicked = { action: "EnterDataCollectionDialogEraseAndStartOverClicked", data?: undefined };
// InteractionUpdated does NOT include cross section drawing and rock picker tool that have separate log events
// as they seem to be the most important.
// IGlobeInteractionName: "force" | "fieldInfo" | "markField" | "assignBoundary" | "continentDrawing" | "continentErasing" | "none"
type InteractionUpdated = { action: "InteractionUpdated", data?: { value: IGlobeInteractionName | ICrossSectionInteractionName | "none" } };
type FullScreenEnabled = { action: "FullScreenEnabled", data?: undefined };
type FullScreenDisabled = { action: "FullScreenDisabled", data?: undefined };
type KeysAndOptionsVisible = { action: "KeysAndOptionsVisible", data?: undefined };
type KeysAndOptionsHidden = { action: "KeysAndOptionsHidden", data?: undefined };
// TabName: "map-type" | "seismic-data" | "options"
type KeysAndOptionsTabChanged = { action: "KeysAndOptionsTabChanged", data?: { value: TabName } };
// Either by clicking on the earth surface, in the cross-section, or in the rock key directly.
// RockKeyLabel: all the rock names visible in the rock key
type RockKeyInfoDisplayed = { action: "RockKeyInfoDisplayed", data?: { value: RockKeyLabel } };
type AdvancedOptionToggled = { action: "AdvancedOptionToggled", data?: { label: string, value: any } };
type SimulationSpeedUpdated = { action: "SimulationSpeedUpdated", data?: { value: number } };
// Model shared using Advanced Options tab
type ModelShared = { action: "ModelShared", data?: undefined };
type ShareDialogOpened = { action: "ShareDialogOpened", data?: undefined };
type AboutDialogOpened = { action: "AboutDialogOpened", data?: undefined };
type ReloadIconClicked = { action: "ReloadIconClicked", data?: undefined };
type ResetPlanetOrientationClicked = { action: "ResetPlanetOrientationClicked", data?: undefined };
type ResetCrossSectionOrientationClicked = { action: "ResetCrossSectionOrientationClicked", data?: undefined };
type CrossSectionClosed = { action: "CrossSectionClosed", data?: undefined };
type CrossSectionDrawingFinished = { action: "CrossSectionDrawingFinished", data?: undefined };
type CrossSectionZoomInClicked = { action: "CrossSectionZoomInClicked", data?: undefined };
type CrossSectionZoomOutClicked = { action: "CrossSectionZoomOutClicked", data?: undefined };
type PlanetWizardNumberOfPlatesSelected = { action: "PlanetWizardNumberOfPlatesSelected", data: { value: string }};
type ContinentAdded = { action: "ContinentAdded", data?: undefined };
type ContinentRemoved = { action: "ContinentRemoved", data?: undefined };
// BoundaryType: "convergent" | "divergent"
type BoundaryTypeSelected = { action: "BoundaryTypeSelected", data: { value: BoundaryType }};
// value is array of plate names
type PlateDensitiesUpdated = { action: "PlateDensitiesUpdated", data: { value: string[] }}
type PlanetWizardNextButtonClicked = { action: "PlanetWizardNextButtonClicked", data?: undefined };
type PlanetWizardBackButtonClicked = { action: "PlanetWizardBackButtonClicked", data?: undefined };
type PlanetWizardFailedValidationContinueAnywayButtonClicked = { action: "PlanetWizardFailedValidationContinueAnywayButtonClicked", data?: undefined };
type PlanetWizardFailedValidationTryAgainButtonClicked = { action: "PlanetWizardFailedValidationTryAgainButtonClicked", data?: undefined };

export type LogEvent = SimulationStarted | SimulationStopped | EarthquakesVisible | EarthquakesHidden | MapTypeUpdated |
  VolcanicEruptionsVisible | VolcanicEruptionsHidden | CrossSectionDrawingEnabled | CrossSectionDrawingDisabled |
  MeasureTempPressureEnabled | MeasureTempPressureDisabled | RockPickerEnabled | RockPickerDisabled | InteractionUpdated |
  FullScreenEnabled | FullScreenDisabled | SimulationReloaded | SimulationReset | SimulationStepForward | SimulationStepBack |
  KeysAndOptionsVisible | KeysAndOptionsHidden | KeysAndOptionsTabChanged | RockKeyInfoDisplayed | AdvancedOptionToggled |
  SimulationSpeedUpdated | ModelShared | ShareDialogOpened | AboutDialogOpened | ReloadIconClicked |
  ResetPlanetOrientationClicked | ResetCrossSectionOrientationClicked | CrossSectionDrawingFinished |
  CrossSectionClosed | CrossSectionZoomInClicked | CrossSectionZoomOutClicked |
  PlanetWizardNumberOfPlatesSelected | ContinentAdded | ContinentRemoved | BoundaryTypeSelected | PlateDensitiesUpdated |
  PlanetWizardNextButtonClicked | PlanetWizardBackButtonClicked | PlanetWizardFailedValidationContinueAnywayButtonClicked |
  PlanetWizardFailedValidationTryAgainButtonClicked | DataCollectionEnabled | DataCollectionDisabled | ExitDataCollectionDialogOpened |
  ExitDataCollectionDialogContinueClicked | ExitDataCollectionDialogSaveAndExitClicked | DataCollectionDialogSubmitClicked |
  DataCollectionDialogDiscardClicked | CrossSectionDataSamplePlaced | EnterDataCollectionDialogOpened | EnterDataCollectionDialogCancelClicked |
  EnterDataCollectionDialogEraseAndStartOverClicked
;

export const log = (event: LogEvent) => {
  laraLog(event.action, event.data);
};
