import * as THREE from "three";
import $ from "jquery";
import { EventEmitter2 } from "eventemitter2";
import { IInteractionHandler, mousePos, mousePosNormalized } from "./helpers";

let _instanceId = 0;

export interface IView {
  domElement: HTMLElement;
  controls: {
    enableRotate: boolean;
  };
  camera: THREE.Camera;
}

export class BaseInteractionsManager {
  namespace: string;
  activeInteraction: IInteractionHandler | null;
  emitter: EventEmitter2;
  interactions: Record<string, IInteractionHandler> = {};
  raycaster: THREE.Raycaster;
  view: IView;

  constructor(view: IView) {
    this.namespace = `interactions-manager-${_instanceId++}`;

    this.view = view;

    this.emitter = new EventEmitter2();
    this.raycaster = new THREE.Raycaster();

    this.getIntersection = this.getIntersection.bind(this);
    this.emit = this.emit.bind(this);

    this.activeInteraction = null;
  }

  setInteraction(name: string) {
    this.view.domElement.style.cursor = "auto";
    if (this.activeInteraction) {
      this.activeInteraction = null;
      this.disableEventHandlers();
    }
    if (name && this.interactions[name]) {
      this.activeInteraction = this.interactions[name];
      this.enableEventHandlers();
      if (this.activeInteraction.cursor) {
        this.setCursor(this.activeInteraction.cursor);
      }
    }
  }

  setCursor(cursor: string) {
    this.view.domElement.style.cursor = cursor;
  }

  setScreenWidth(value: number) {
    Object.values(this.interactions).forEach(interaction => {
      if (interaction.setScreenWidth) {
        interaction.setScreenWidth(value);
      }
    });
  }

  getIntersection(mesh: THREE.Mesh) {
    return this.raycaster.intersectObject(mesh)[0] || undefined;
  }

  emit(event: string, data: any) {
    this.emitter.emit(event, data);
  }

  on(event: string, handler: any) {
    this.emitter.on(event, handler);
  }

  isOverDomElement(x = -9999, y = -9999) {
    // Use boundary test because event.target may be an overlay (e.g. temp/pressure tool)
    const bounds = this.view.domElement.getBoundingClientRect();
    return ((x >= bounds.left) && (x <= bounds.right) && (y >= bounds.top) && (y <= bounds.bottom));
  }

  enableEventHandlers() {
    // Use document to handle some edge cases when mouse up is emitted on top of a different element.
    // This happens in Assign Boundary Type interaction - there's a dialog injected between canvas and mouse pointer,
    // so mouseup would be never detected if event handlers were added only to this.view.domElement.
    const $elem = $(document);
    const interaction = this.activeInteraction;
    if (!interaction) {
      return;
    }
    let wasCameraUnlocked = false;
    $elem.on(`pointerdown.${this.namespace}`, (event) => {
      if ((event.target as any) !== this.view.domElement) {
        return;
      }
      if (interaction.onPointerDown) {
        const canvasPos = mousePos(event, this.view.domElement);
        const globePos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(globePos, this.view.camera);
        const cameraLockRequestedByInteraction = interaction.onPointerDown(canvasPos);
        wasCameraUnlocked = this.view.controls.enableRotate;
        if (cameraLockRequestedByInteraction && wasCameraUnlocked) {
          this.view.controls.enableRotate = false;
        }
      }
    });
    $elem.on(`pointermove.${this.namespace}`, (event) => {
      // use boundary test or target test depending on whether interaction requires an overlay
      if (interaction.emitMoveEventWithOverlay
            ? !this.isOverDomElement(event.clientX, event.clientY)
            : (event.target as any) !== this.view.domElement) {
        interaction.onPointerOff?.();
        return;
      }
      if (interaction.onPointerMove) {
        const canvasPos = mousePos(event, this.view.domElement);
        const globePos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(globePos, this.view.camera);
        interaction.onPointerMove(canvasPos);
      }
    });
    $elem.on(`pointerup.${this.namespace} pointercancel.${this.namespace}`, (event) => {
      if (wasCameraUnlocked) {
        this.view.controls.enableRotate = true;
      }
      if ((event.target as any) !== this.view.domElement) {
        return;
      }
      if (interaction.onPointerUp) {
        const canvasPos = mousePos(event, this.view.domElement);
        const globePos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(globePos, this.view.camera);
        interaction.onPointerUp(canvasPos);
      }
    });
  }

  disableEventHandlers() {
    $(document).off(`.${this.namespace}`);
  }
}
