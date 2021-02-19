import * as THREE from "three";
import { hueAndElevationToRgb } from "../colormaps";
import PointLabel from "./point-label";
import config from "../config";

const RADIUS = 1.025;

export default class PlateLabel {
  constructor (plate) {
    // Pick a dark color from the ocean, so white text is always visible
    const labelColor = hueAndElevationToRgb(plate.hue, config.oceanicRidgeElevation);
    this.label = new PointLabel(plate.id + 1, labelColor, "#FFF");

    this.root = new THREE.Object3D();
    this.root.add(this.label);
  }

  update (plate) {
    this.label.position.copy(plate.center).multiplyScalar(RADIUS);
  }

  dispose () {
    this.label.material.dispose();
  }

  set visible (v) {
    this.root.visible = v;
  }
}
