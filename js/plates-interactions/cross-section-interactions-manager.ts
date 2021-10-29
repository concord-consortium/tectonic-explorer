import CrossSectionClick from "./cross-section-click";
import CrossSection3D from "../plates-view/cross-section-3d";
import { TakeRockSampleCursor, IInteractionHandler } from "./helpers";
import { BaseInteractionsManager } from "./base-interactions-manager";
import { SimulationStore } from "../stores/simulation-store";

export type ICrossSectionInteractionName = "takeRockSample";

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
