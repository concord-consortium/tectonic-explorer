import * as THREE from "three";
import CylinderArc from "./cylinder-arc";
import PointLabel from "./point-label";
import { getCrossSectionLinesVisibility } from "../plates-model/cross-section-utils";

const ARC_SEGMENTS = 16;
const ARC_WIDTH = 0.01;
const RADIUS = 1.07;

export default class CrossSectionMarkers {
  cylinder1: CylinderArc;
  cylinder2: CylinderArc;
  cylinder3: CylinderArc;
  cylinder4: CylinderArc;
  label1: THREE.Sprite;
  label2: THREE.Sprite;
  label3: THREE.Sprite;
  label4: THREE.Sprite;
  root: THREE.Object3D;

  constructor() {
    this.label1 = new PointLabel("P1", "#fff", "#444") as THREE.Sprite;
    this.label2 = new PointLabel("P2", "#fff", "#444") as THREE.Sprite;
    this.cylinder1 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH);
    this.cylinder1.root.scale.set(RADIUS, RADIUS, RADIUS);

    this.root = new THREE.Object3D();
    this.root.add(this.cylinder1.root);
    this.root.add(this.label1);
    this.root.add(this.label2);

    this.label3 = new PointLabel("P3", "#fff", "#444") as THREE.Sprite;
    this.label4 = new PointLabel("P4", "#fff", "#444") as THREE.Sprite;
    this.cylinder2 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH);
    this.cylinder2.root.scale.set(RADIUS, RADIUS, RADIUS);
    this.cylinder3 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH);
    this.cylinder3.root.scale.set(RADIUS, RADIUS, RADIUS);
    this.cylinder4 = new CylinderArc(ARC_SEGMENTS, ARC_WIDTH);
    this.cylinder4.root.scale.set(RADIUS, RADIUS, RADIUS);

    this.root.add(this.cylinder2.root);
    this.root.add(this.cylinder3.root);
    this.root.add(this.cylinder4.root);
    this.root.add(this.label3);
    this.root.add(this.label4);
  }

  update(point1: any, point2: any, point3: any, point4: any, cameraAngle: any) {
    const linesVis = getCrossSectionLinesVisibility(point1, point2, point3, point4, cameraAngle);
    const labelRadius = RADIUS + 0.015;
    if (point1 && point2) {
      this.label1.position.copy(point1).multiplyScalar(labelRadius);
      this.label2.position.copy(point2).multiplyScalar(labelRadius);
      this.cylinder1.update(point1, point2);
      this.root.visible = true;

      if (linesVis && point3 && point4) {
        this.label3.visible = true;
        this.label4.visible = true;
        this.label3.position.copy(point3).multiplyScalar(labelRadius);
        this.label4.position.copy(point4).multiplyScalar(labelRadius);
        this.cylinder2.update(point2, point3);
        this.cylinder3.update(point3, point4);
        this.cylinder4.update(point4, point1);
        this.cylinder1.setVisibility(linesVis.p1p2);
        this.cylinder2.setVisibility(linesVis.p2p3);
        this.cylinder3.setVisibility(linesVis.p3p4);
        this.cylinder4.setVisibility(linesVis.p4p1);
      } else {
        this.label3.visible = false;
        this.label4.visible = false;
        this.cylinder2.update(null, null);
        this.cylinder3.update(null, null);
        this.cylinder4.update(null, null);
      }
    } else {
      this.root.visible = false;
    }
  }
}
