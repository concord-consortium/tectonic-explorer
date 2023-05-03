import CrossSectionClick from "./cross-section-click";
import CrossSection3D from "../plates-view/cross-section-3d";
import { TakeRockSampleCursor, IInteractionHandler, CollectDataCursor } from "./helpers";
import { BaseInteractionsManager } from "./base-interactions-manager";
import { SimulationStore } from "../stores/simulation-store";
import { getPressure, getTemperature } from "../plates-model/get-temp-and-pressure";

export type ICrossSectionInteractionName = "measureTempPressure" | "takeRockSample" | "collectData";

export type ICrossSectionInteractions = Record<ICrossSectionInteractionName, IInteractionHandler>;

export default class CrossSectionInteractionsManager extends BaseInteractionsManager {
  interactions: ICrossSectionInteractions;

  constructor(view: CrossSection3D, simulationStore: SimulationStore) {
    super(view);

    const baseOptions = {
      getIntersection: this.getIntersection,
      wallMesh: {
        front: view.frontWall,
        back: view.backWall,
        right: view.rightWall,
        left: view.leftWall,
        top: view.topWall,
      }
    };
    this.interactions = {
      measureTempPressure: new CrossSectionClick({
        ...baseOptions,
        cursor: "none",
        emitMoveEventWithOverlay: true,
        onPointerMove: ({ wall, intersection }) => {
          const intersectionData = view.getIntersectionData(wall, intersection);
          if (intersectionData?.field || intersectionData?.label) {
            const pressure = getPressure(simulationStore.model, intersectionData, intersection);
            const temperature = getTemperature(simulationStore.model, intersectionData, intersection);
            simulationStore?.setTempAndPressure(temperature, pressure);
          } else {
            simulationStore?.setTempAndPressure(null, null);
          }
          this.setCursor("none");
          simulationStore?.setIsCursorOverCrossSection(true);
        },
        onPointerOff: () => {
          simulationStore?.setTempAndPressure(null, null);
          this.setCursor("not-allowed");
          simulationStore?.setIsCursorOverCrossSection(false);
        }
      }),
      takeRockSample: new CrossSectionClick({
        ...baseOptions,
        cursor: TakeRockSampleCursor,
        onPointerDown: ({ wall, intersection }) => {
          simulationStore?.setSelectedRock(view.getIntersectionData(wall, intersection)?.label || null);
          simulationStore?.setSelectedRockFlash(true);
        }
      }),
      collectData: new CrossSectionClick({
        ...baseOptions,
        cursor: CollectDataCursor,
        onPointerDown: ({ wall, intersection }) => {
          const intersectionData = view.getIntersectionData(wall, intersection);

          if (simulationStore?.at20DataSamples && simulationStore?.arePinsLimited) {
            return;
          }

          if (simulationStore?.dataSamples.length === 19 && simulationStore?.arePinsLimited) {
            simulationStore.setPinLimitReached();
          }

          if (intersectionData?.label) {
            const pressure = getPressure(simulationStore.model, intersectionData, intersection);
            const temperature = getTemperature(simulationStore.model, intersectionData, intersection);
            simulationStore?.setCurrentDataSample({
              crossSectionWall: wall,
              coords: intersection,
              type: intersectionData.label,
              pressure,
              temperature,
              selected: true // the most recent data sample is always selected
            });
          }
        }
      }),
    };
  }
}
