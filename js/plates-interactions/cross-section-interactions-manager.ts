import CrossSectionClick from "./cross-section-click";
import CrossSection3D from "../plates-view/cross-section-3d";
import { TakeRockSampleCursor, IInteractionHandler, TempPressureCursor } from "./helpers";
import { BaseInteractionsManager } from "./base-interactions-manager";
import { SimulationStore } from "../stores/simulation-store";

export type ICrossSectionInteractionName = "measureTempPressure" | "takeRockSample";

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
        cursor: TempPressureCursor,
        onPointerMove: ({ wall, intersection }) => {
          const target = view.getInteractiveObjectAt(wall, intersection);
          const isRockTarget = !["Ocean", "Sky", null].includes(target);
          // estimate depth from y coordinate
          const minYCoordObserved = 45;
          const maxYCoordObserved = 270;
          const yCoordRangeObserved = maxYCoordObserved - minYCoordObserved;
          // TODO: get real temperature and pressure values from model
          const yPctObserved = isRockTarget ? intersection.y / yCoordRangeObserved : null;
          simulationStore?.setTempAndPressure(yPctObserved, yPctObserved);
          this.setCursor(TempPressureCursor);
        },
        onPointerOff: () => {
          simulationStore?.setTempAndPressure(null, null);
          this.setCursor("not-allowed");
        }
      }),
      takeRockSample: new CrossSectionClick({
        ...baseOptions,
        cursor: TakeRockSampleCursor,
        onPointerDown: ({ wall, intersection }) => {
          simulationStore?.setSelectedRock(view.getInteractiveObjectAt(wall, intersection));
          simulationStore?.setSelectedRockFlash(true);
        }
      }),
    };
  }
}
