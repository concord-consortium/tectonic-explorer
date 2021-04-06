import * as THREE from "three";
import { hueAndElevationToRgb } from "../colormaps";
import PointLabel from "./point-label";
import config from "../config";

const RADIUS = 1.05;

export default class PlateLabel {
  label: any;
  root: any;
  
  constructor(plate: any) {
    // Pick a dark color from the ocean, so white text is always visible
    const labelColor = hueAndElevationToRgb(plate.hue, config.oceanicRidgeElevation);
    this.label = new PointLabel(plate.id + 1, labelColor, "#FFF");

    this.root = new THREE.Object3D();
    this.root.add(this.label);
  }

  update(plate: any) {
    this.label.position.copy(plate.center).multiplyScalar(RADIUS);
  }

  dispose() {
    this.label.material.dispose();
  }

  set visible(v: any) {
    this.root.visible = v;
  }
}
