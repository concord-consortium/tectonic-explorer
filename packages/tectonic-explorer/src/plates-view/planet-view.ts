import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { autorun, observe } from "mobx";
import PlateMesh, { PLATE_RADIUS } from "./plate-mesh";
import FieldMarker from "./field-marker";
import ForceArrow from "./force-arrow";
import CrossSectionMarkers from "./cross-section-markers";
import NPoleLabel from "./n-pole-label";
import LatLongLines from "./lat-long-lines";
import { topoColor } from "../colors/topographic-colors";
import { RGBAFloatToHexNumber } from "../colors/utils";
import getThreeJSRenderer from "../get-threejs-renderer";
import { SimulationStore } from "../stores/simulation-store";

export const PLANET_VIEW_CANVAS_ID = "planet-view-canvas";

// Mantle color is actually blue, as it's visible where two plates are diverging.
// This crack should represent oceanic ridge.
const MANTLE_DUCTILE_COLOR = RGBAFloatToHexNumber(topoColor(0.40));

export default class PlanetView {
  _prevTimestamp: any;
  camera: any;
  controls: any;
  crossSectionMarkers: any;
  debugMarker: any;
  fieldMarkers: any;
  hotSpotMarker: any;
  latLongLines: any;
  light: any;
  nPoleLabel: any;
  plateMeshes: any;
  renderer: any;
  scene: any;
  store: SimulationStore;
  suppressCameraChangeEvent: any;

  constructor(store: SimulationStore) {
    this.store = store;

    const Renderer = getThreeJSRenderer();
    this.renderer = new Renderer({
      // Enable antialias only on non-high-dpi displays.
      antialias: window.devicePixelRatio < 2
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.plateMeshes = new Map();

    this.basicSceneSetup();
    this.addStaticMantle();
    this.addCrossSectionMarkers();
    this.addHotSpotMarker();
    this.addDebugMarker();
    this.addNPoleMarker();
    this.addLatLongLines();

    // Little markers that can be used to trace some fields.
    this.fieldMarkers = [];

    this.suppressCameraChangeEvent = false;
    this.controls.addEventListener("change", () => {
      if (!this.suppressCameraChangeEvent) {
        this.store.setPlanetCameraPosition(this.getCameraPosition());
      }
    });

    // See shutterbug-support.js
    if (this.domElement.className.indexOf("canvas-3d") === -1) {
      this.domElement.className += " canvas-3d";
    }
    this.domElement.id = PLANET_VIEW_CANVAS_ID;
    this.domElement.render = this.render.bind(this);

    this.requestAnimFrame = this.requestAnimFrame.bind(this);
    this.requestAnimFrame();

    this.observeStore(store);
  }

  observeStore(store: SimulationStore) {
    autorun(() => {
      const {
        crossSectionPoint1: p1, crossSectionPoint2: p2, crossSectionPoint3: _p3, crossSectionPoint4: _p4,
        isDrawingCrossSection, showCrossSectionView, crossSectionCameraAngle, currentHotSpot, debugMarker, renderLatLongLines
      } = store;
      // don't draw the rest of the box until cross-section drawing is complete
      const p3 = !isDrawingCrossSection && showCrossSectionView ? _p3 : undefined;
      const p4 = !isDrawingCrossSection && showCrossSectionView ? _p4 : undefined;
      this.crossSectionMarkers.update(p1, p2, p3, p4, crossSectionCameraAngle);
      this.hotSpotMarker.update(currentHotSpot);
      this.debugMarker.position.copy(debugMarker);
      this.latLongLines.visible = renderLatLongLines;
    });
    autorun(() => {
      this.setFieldMarkers(store.model.fieldMarkers);
    });
    // Keep observers separate due to performance reasons. Camera position update happens very often, so keep this
    // observer minimal.
    autorun(() => {
      this.setCameraPosition(store.planetCameraPosition);
    });
    autorun(() => {
      this.controls.enableRotate = !store.planetCameraLocked && !store.planetCameraAnimating;
    });
    observe(store.model.platesMap, () => {
      this.updatePlates(store.model.platesMap);
    });
  }

  get domElement() {
    return this.renderer.domElement;
  }

  dispose() {
    // There's no need for the app / view to remove itself and cleanup, but keep it here as a reminder
    // if requirements change in the future.
    console.warn("View3D#dispose is not implemented!");
    // If it's ever necessary, remember to dispose mobx observers.
  }

  getCameraPosition() {
    return this.camera.position.toArray();
  }

  setCameraPosition(val: any) {
    this.suppressCameraChangeEvent = true;
    this.camera.position.fromArray(val);
    this.controls.update();
    this.suppressCameraChangeEvent = false;
  }

  resize(parent: any) {
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  basicSceneSetup() {
    const size = this.renderer.getSize(new THREE.Vector2());

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(33, size.x / size.y, 0.1, 100);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.position.set(4.5, 0, 0);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.5;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 10;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    this.light = new THREE.DirectionalLight(0xffffff, 2.3);
    this.scene.add(this.light);
  }

  addStaticMantle() {
    // Add "mantle". It won't be visible most of the time.
    const material = new THREE.MeshPhongMaterial({ color: MANTLE_DUCTILE_COLOR });
    const geometry = new THREE.SphereGeometry(PLATE_RADIUS * 0.9, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  addPlateMesh(plate: any) {
    const plateMesh = new PlateMesh(plate.id, this.store);
    this.plateMeshes.set(plate.id, plateMesh);
    this.scene.add(plateMesh.root);
    this.adjustLatLongLinesRadius();
    return plateMesh;
  }

  removePlateMesh(plateMesh: any) {
    this.scene.remove(plateMesh.root);
    plateMesh.dispose();
    this.plateMeshes.delete(plateMesh.plateId);
    this.adjustLatLongLinesRadius();
  }

  addCrossSectionMarkers() {
    this.crossSectionMarkers = new CrossSectionMarkers();
    this.scene.add(this.crossSectionMarkers.root);
  }

  addHotSpotMarker() {
    this.hotSpotMarker = new ForceArrow(0xff3300);
    this.scene.add(this.hotSpotMarker.root);
  }

  addDebugMarker() {
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const geometry = new THREE.SphereGeometry(0.015, 6, 6);
    this.debugMarker = new THREE.Mesh(geometry, material);
    this.scene.add(this.debugMarker);
  }

  addNPoleMarker() {
    this.nPoleLabel = new NPoleLabel();
    this.nPoleLabel.position.y = 1.03;
    this.scene.add(this.nPoleLabel.root);
  }

  addLatLongLines() {
    this.latLongLines = new LatLongLines();
    this.scene.add(this.latLongLines.root);
  }

  adjustLatLongLinesRadius() {
    this.latLongLines.radius = PLATE_RADIUS + 0.002;
  }

  setFieldMarkers(markers: any) {
    while (this.fieldMarkers.length < markers.length) {
      const fieldMarker = new FieldMarker(0xff0000);
      this.fieldMarkers.push(fieldMarker);
      this.scene.add(fieldMarker.root);
    }
    while (this.fieldMarkers.length > markers.length) {
      const fieldMarker = this.fieldMarkers.pop();
      this.scene.remove(fieldMarker.root);
      fieldMarker.dispose();
    }
    markers.forEach((markerPos: any, idx: any) => {
      this.fieldMarkers[idx].setPosition(markerPos);
    });
  }

  updatePlates(plates: any) {
    const platePresent: Record<string, boolean> = {};
    plates.forEach((plate: any) => {
      platePresent[plate.id] = true;
      if (!this.plateMeshes.has(plate.id)) {
        this.addPlateMesh(plate);
      }
    });
    // Remove plates that don't exist anymore.
    this.plateMeshes.forEach((plateMesh: any) => {
      if (!platePresent[plateMesh.plateId]) {
        this.removePlateMesh(plateMesh);
      }
    });
  }

  requestAnimFrame() {
    window.requestAnimationFrame(this.requestAnimFrame);
    this.render();
  }

  render(timestamp = window.performance.now()) {
    const progress = this._prevTimestamp ? timestamp - this._prevTimestamp : 0;
    this.plateMeshes.forEach((plateMesh: any) => plateMesh.updateTransitions(progress));
    this.light.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    this._prevTimestamp = timestamp;
  }
}
