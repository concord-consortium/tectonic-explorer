import * as THREE from "three";

const RADIUS = 0.01;
// Arrow points up when it's created.
const BASE_ORIENTATION = new THREE.Vector3(0, 1, 0);
const MIN_LENGTH = 0.01;
export const LENGTH_RATIO = 0.1;

function pointMarker (material: any) {
  const geometry = new THREE.SphereGeometry(RADIUS * 1.3, 12, 12);
  return new THREE.Mesh(geometry, material);
}

function cylinder (material: any) {
  const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 12);
  return new THREE.Mesh(geometry, material);
}

function arrowHead (material: any) {
  const geometry = new THREE.CylinderGeometry(0, RADIUS * 2, 0.05, 12);
  return new THREE.Mesh(geometry, material);
}

export default class ForceArrow {
  _visible: any;
  arrowHead: any;
  cylinder: any;
  marker: any;
  material: any;
  root: any;
  constructor (color: any) {
    this.material = new THREE.MeshLambertMaterial({ color });
    this.marker = pointMarker(this.material);
    this.cylinder = cylinder(this.material);
    this.arrowHead = arrowHead(this.material);
    this.root = new THREE.Object3D();
    this.root.add(this.marker);
    this.root.add(this.cylinder);
    this.root.add(this.arrowHead);
    this.visible = true;
  }

  get visible () {
    return this._visible;
  }

  set visible (v) {
    this._visible = v;
    this.root.visible = v;
  }

  dispose () {
    this.material.dispose();
    this.marker.geometry.dispose();
    this.cylinder.geometry.dispose();
    this.arrowHead.geometry.dispose();
  }

  setLength (len: any) {
    this.cylinder.position.y = 0.5 * len;
    this.cylinder.scale.y = len;
    this.arrowHead.position.y = len;
  }

  update (props: any) {
    if (!props) {
      this.root.visible = false;
      return;
    }
    const { force, position } = props;
    const newLen = force.length() * LENGTH_RATIO;
    if (newLen < MIN_LENGTH) {
      this.root.visible = false;
      return;
    }
    this.root.visible = this.visible;
    this.root.position.copy(position);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(BASE_ORIENTATION, force.clone().normalize());
    this.root.quaternion.copy(q);
    this.setLength(force.length() * LENGTH_RATIO);
  }
}
