import CrossSectionDrawing from "./cross-section-drawing";
import ForceDrawing from "./force-drawing";
import PlanetClick from "./planet-click";
import { IInteractionHandler, TakeRockSampleCursor } from "./helpers";
import { BaseInteractionsManager } from "./base-interactions-manager";
import PlanetView from "../plates-view/planet-view";

export type IGlobeInteractionName = "crossSection" | "force" | "fieldInfo" | "markField" | "assignBoundary" |
  "continentDrawing" | "continentErasing" | "measureTempPressure" | "takeRockSample";

export type IGlobeInteractions = Record<IGlobeInteractionName, IInteractionHandler>;

export default class GlobeInteractionsManager extends BaseInteractionsManager {
  interactions: IGlobeInteractions;

  constructor(view: PlanetView) {
    super(view);

    const baseOptions = {
      getIntersection: this.getIntersection,
      emit: this.emit
    };
    this.interactions = {
      crossSection: new CrossSectionDrawing(baseOptions),
      force: new ForceDrawing(baseOptions),
      fieldInfo: new PlanetClick({ ...baseOptions, startEventName: "fieldInfo" }),
      markField: new PlanetClick({ ...baseOptions, startEventName: "markField" }),
      continentDrawing: new PlanetClick({ ...baseOptions, startEventName: "continentDrawing", moveEventName: "continentDrawing", endEventName: "continentDrawingEnd" }),
      continentErasing: new PlanetClick({ ...baseOptions, startEventName: "continentErasing", moveEventName: "continentErasing", endEventName: "continentErasingEnd" }),
      measureTempPressure: new PlanetClick({ ...baseOptions, cursor: "not-allowed", emitMoveEventWithOverlay: true }),
      takeRockSample: new PlanetClick({ ...baseOptions, startEventName: "takeRockSampleFromSurface", cursor: TakeRockSampleCursor }),
      assignBoundary: new PlanetClick({ ...baseOptions, startEventName: "assignBoundary", moveEventName: "highlightBoundarySegment", alwaysEmitMoveEvent: true }),
    };
  }
}
