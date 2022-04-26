import * as THREE from "three";

// Returns color between gray (vis = 0) and white (vis = 1) in format accepted by THREE.js (integer).
function getColor(visibility = 1) {
  const c = Math.round(165 * visibility + 90);
  return c * 256 * 256 + c * 256 + c;
}

export default class CylinderArc {
  material: any;
  normalAttr: any;
  positionAttr: any;
  root: any;
  segments: any;
  width: any;

  constructor(segments: any, width: any) {
    this.segments = segments;
    this.width = width;
    const numberOfVertices = segments * 4 * 3; // 4 faces per segment, 3 vertices per face

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(numberOfVertices * 3), 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(numberOfVertices * 3), 3));
    this.positionAttr = geometry.attributes.position;
    this.normalAttr = geometry.attributes.normal;
    this.positionAttr.setUsage(THREE.DynamicDrawUsage);
    this.normalAttr.setUsage(THREE.DynamicDrawUsage);

    this.material = new THREE.MeshLambertMaterial({ color: getColor(), emissive: getColor() });
    this.root = new THREE.Mesh(geometry, this.material);
  }

  set visible(v: any) {
    this.root.visible = v;
  }

  update(point1: any, point2: any) {
    if (!point1 || !point2) {
      this.visible = false;
      return;
    }
    this.visible = true;
    if (point1.angleTo(point2) < 0.01) {
      this.resetAttributes();
      return;
    }

    const stepRotation = new THREE.Quaternion();
    const finalQuat = new THREE.Quaternion();
    finalQuat.setFromUnitVectors(point1, point2);
    stepRotation.slerp(finalQuat, 1 / this.segments);
    const p1 = point1.clone();
    const p2 = point1.clone();
    const center = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < this.segments; i += 1) {
      const vi = i * 12;
      p2.applyQuaternion(stepRotation);
      const sideOffset = p2.clone().sub(p1).cross(p1).setLength(this.width * 0.5);
      const v1 = p1.clone().add(sideOffset);
      const v2 = p2.clone().add(sideOffset);
      const v3 = p1.clone().sub(sideOffset);
      const v4 = p2.clone().sub(sideOffset);
      // Side triangle 1
      this.setFaceNormal(vi, v1.clone().cross(v2));
      this.setVertex(vi, v1);
      this.setVertex(vi + 1, center);
      this.setVertex(vi + 2, v2);
      // Side triangle 2
      this.setFaceNormal(vi + 3, v3.clone().cross(v4));
      this.setVertex(vi + 3, v4);
      this.setVertex(vi + 4, center);
      this.setVertex(vi + 5, v3);
      // Top triangle 1
      this.setFaceNormal(vi + 6, v1.clone().sub(v2).cross(v3.clone().sub(v2)));
      this.setVertex(vi + 6, v1);
      this.setVertex(vi + 7, v2);
      this.setVertex(vi + 8, v3);
      // Top triangle 2
      this.setFaceNormal(vi + 9, v3.clone().sub(v2).cross(v4.clone().sub(v2)));
      this.setVertex(vi + 9, v3);
      this.setVertex(vi + 10, v2);
      this.setVertex(vi + 11, v4);
      p1.copy(p2);
    }
    this.positionAttr.needsUpdate = true;
    this.normalAttr.needsUpdate = true;
  }

  setVisibility(vis: any) {
    this.material.color.set(getColor(vis));
    this.material.emissive.set(getColor(vis));
  }

  resetAttributes() {
    const pos = this.positionAttr.array;
    const norm = this.normalAttr.array;
    for (let i = 0; i < pos.length; i += 1) {
      pos[i] = 0;
      norm[i] = 0;
    }
    this.positionAttr.needsUpdate = true;
    this.normalAttr.needsUpdate = true;
  }

  setVertex(i: any, vec: any) {
    const arr = this.positionAttr.array;
    arr[i * 3] = vec.x;
    arr[i * 3 + 1] = vec.y;
    arr[i * 3 + 2] = vec.z;
  }

  setNormal(i: any, vec: any) {
    const arr = this.normalAttr.array;
    arr[i * 3] = vec.x;
    arr[i * 3 + 1] = vec.y;
    arr[i * 3 + 2] = vec.z;
  }

  // Sets three normals at once.
  setFaceNormal(i: any, vec: any) {
    this.setNormal(i, vec);
    this.setNormal(i + 1, vec);
    this.setNormal(i + 2, vec);
  }
}
