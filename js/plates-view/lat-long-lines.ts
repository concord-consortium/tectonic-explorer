import * as THREE from "three";

function longitudeCircle() {
  const radius = 1;
  const curve = new THREE.EllipseCurve(
    0, 0, // ax, aY
    radius, radius, // xRadius, yRadius
    0, 2 * Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  return new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
}

export default class LatLongLines {
  root: any;
  constructor(latCount = 12) {
    this.root = new THREE.Object3D();

    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const geometry = longitudeCircle();

    const longCount = latCount * 2;
    for (let i = 0; i < longCount; i += 1) {
      const line = new THREE.Line(geometry, material);
      line.rotation.y = i * 2 * Math.PI / longCount;
      this.root.add(line);
    }
    for (let i = 1; i < latCount; i += 1) {
      const line = new THREE.Line(geometry, material);
      line.rotation.x = Math.PI / 2;
      const y = -1 + 2 * i / latCount;
      line.position.y = y;
      const radius = Math.sqrt(1 - y * y);
      line.scale.set(radius, radius, radius);
      this.root.add(line);
    }
  }

  set visible(v: any) {
    this.root.visible = v;
  }

  set radius(v: any) {
    this.root.scale.set(v, v, v);
  }
}
