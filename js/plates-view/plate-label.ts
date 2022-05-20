import * as THREE from "three";
import { hueToColor } from "../colors/utils";
import PointLabel from "./point-label";

const RADIUS = 1.05;

export default class PlateLabel {
  label: any;
  root: any;

  constructor(plate: any) {
    const labelColor = hueToColor(plate.hue, "base");
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
