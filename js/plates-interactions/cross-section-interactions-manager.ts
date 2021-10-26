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
      frontWall: view.frontWall,
      backWall: view.backWall,
      rightWall: view.rightWall,
      leftWall: view.leftWall,
      topWall: view.topWall,
    };
    this.interactions = {
      takeRockSample: new CrossSectionClick({
        ...baseOptions,
        cursor: TakeRockSampleCursor,
        onPointerDown: ({ wall, intersection }) => {
          simulationStore?.setSelectedRock(view.getInteractiveObjectAt(wall, intersection));
        }
      }),
    };
  }
}
