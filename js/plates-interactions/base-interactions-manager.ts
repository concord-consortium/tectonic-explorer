import * as THREE from "three";
import $ from "jquery";
import { EventEmitter2 } from "eventemitter2";
import { IInteractionHandler, mousePosNormalized } from "./helpers";

const NAMESPACE = "interactions-manager";

export interface IView {
  domElement: HTMLElement;
  controls: {
    enableRotate: boolean;
  };
  camera: THREE.Camera;
}

export class BaseInteractionsManager {
  activeInteraction: IInteractionHandler | null;
  emitter: EventEmitter2;
  interactions: Record<string, IInteractionHandler> = {};
  raycaster: THREE.Raycaster;
  view: IView;

  constructor(view: IView) {
    this.view = view;

    this.emitter = new EventEmitter2();
    this.raycaster = new THREE.Raycaster();

    this.getIntersection = this.getIntersection.bind(this);
    this.emit = this.emit.bind(this);

    this.activeInteraction = null;
  }

  setInteraction(name: string) {
    if (this.activeInteraction) {
      this.activeInteraction.setInactive();
      this.activeInteraction = null;
      this.disableEventHandlers();
    }
    if (name && this.interactions[name]) {
      this.activeInteraction = this.interactions[name];
      this.activeInteraction.setActive();
      this.enableEventHandlers();
    }
  }

  setScreenWidth(value: number) {
    Object.values(this.interactions).forEach(interaction => {
      if (interaction.setScreenWidth) {
        interaction.setScreenWidth(value);
      }
    });
  }

  getIntersection(mesh: THREE.Mesh) {
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
    if (!interaction) {
      return;
    }
    $elem.on(`pointerdown.${NAMESPACE}`, (event) => {
      this.view.controls.enableRotate = true;
      if (interaction.onPointerDown) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        this.view.controls.enableRotate = !interaction.onPointerDown();
      }
    });
    $elem.on(`pointermove.${NAMESPACE}`, (event) => {
      if (interaction.onPointerMove) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        interaction.onPointerMove();
      }
    });
    $elem.on(`pointerup.${NAMESPACE} pointercancel.${NAMESPACE}`, (event) => {
      if (interaction.onPointerUp) {
        const pos = mousePosNormalized(event, this.view.domElement);
        this.raycaster.setFromCamera(pos, this.view.camera);
        interaction.onPointerUp();
      }
      this.view.controls.enableRotate = true;
    });
  }

  disableEventHandlers() {
    $(this.view.domElement).off(`.${NAMESPACE}`);
  }
}
