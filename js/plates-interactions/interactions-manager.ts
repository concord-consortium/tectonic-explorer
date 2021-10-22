import * as THREE from "three";
import $ from "jquery";
import { EventEmitter2 } from "eventemitter2";
import CrossSectionDrawing from "./cross-section-drawing";
import ForceDrawing from "./force-drawing";
import PlanetClick from "./planet-click";
import RockSampleCursorSrc from "../../images/rock-sample-cursor.png";

export interface IInteractions {
  crossSection: CrossSectionDrawing;
  force: ForceDrawing;
  fieldInfo: PlanetClick;
  markField: PlanetClick;
  continentDrawing: PlanetClick;
  continentErasing: PlanetClick;
  takeRockSample: PlanetClick;
}

export type IInteractionName = keyof IInteractions | "none";

const NAMESPACE = "interactions-manager";

// Mouse position in pixels.
export function mousePos(event: any, targetElement: any) {
  const $targetElement = $(targetElement);
  const parentX = $targetElement.offset()?.left || 0;
  const parentY = $targetElement.offset()?.top || 0;
  let x = event.pageX;
  let y = event.pageY;
  if (event.touches && event.touches.length > 0) {
    x = event.touches[0].pageX;
    y = event.touches[0].pageY;
  }
  return { x: x - parentX, y: y - parentY };
}

// Normalized mouse position [-1, 1].
export function mousePosNormalized(event: any, targetElement: any) {
  const pos = mousePos(event, targetElement);
  const $targetElement = $(targetElement);
  const parentWidth = $targetElement.width() || 0;
  const parentHeight = $targetElement.height() || 0;
  pos.x = (pos.x / parentWidth) * 2 - 1;
  pos.y = -(pos.y / parentHeight) * 2 + 1;
  return pos;
}

export default class InteractionsManager {
  activeInteraction: any;
  emitter: EventEmitter2;
  interactions: IInteractions;
  raycaster: THREE.Raycaster;
  view: any;

  constructor(view: any) {
    this.view = view;

    this.emitter = new EventEmitter2();
    this.raycaster = new THREE.Raycaster();

    this.getIntersection = this.getIntersection.bind(this);
    this.emit = this.emit.bind(this);

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
      takeRockSample: new PlanetClick({ ...baseOptions, startEventName: "takeRockSampleFromSurface", cursor: `url("${RockSampleCursorSrc}") 16 42, crosshair` }),
    };
    this.activeInteraction = null;
  }

  setInteraction(name: IInteractionName) {
    if (this.activeInteraction) {
      this.activeInteraction.setInactive();
      this.activeInteraction = null;
      this.disableEventHandlers();
    }
    if (name !== "none") {
      this.activeInteraction = this.interactions[name];
      this.activeInteraction.setActive();
      this.enableEventHandlers();
    }
  }

  setScreenWidth(value: any) {
    this.interactions.crossSection.setScreenWidth(value);
  }

  getIntersection(mesh: any) {
    return this.raycaster.intersectObject(mesh)[0] || null;
  }

  emit(event: string, data: any) {
    this.emitter.emit(event, data);
  }

  on(event: string, handler: any) {
    this.emitter.on(event, handler);
  }

  enableEventHandlers() {
    const $elem = $(this.view.domElement);
    const interaction = this.activeInteraction;
    $elem.on(`pointerdown.${NAMESPACE}`, (event) => {
      this.view.controls.enableRotate = true;
      if (interaction.onMouseDown) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        this.view.controls.enableRotate = !interaction.onMouseDown();
      }
    });
    $elem.on(`pointermove.${NAMESPACE}`, (event) => {
      if (interaction.onMouseMove) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        interaction.onMouseMove();
      }
    });
    $elem.on(`pointerup.${NAMESPACE} pointercancel.${NAMESPACE}`, (event) => {
      if (interaction.onMouseUp) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        interaction.onMouseUp();
      }
      this.view.controls.enableRotate = true;
    });
  }

  disableEventHandlers() {
    $(this.view.domElement).off(`.${NAMESPACE}`);
  }
}
