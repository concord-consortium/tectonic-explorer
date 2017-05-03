import * as THREE from 'three';
import grid from '../plates-model/grid';

const ARROWS = grid.size;
const WIDTH = 0.004;
const LENGTH_SCALE = 1;
const NULL_POS = {x: 0, y: 0, z: 0};

export default class VectorsMesh {
  constructor(plate) {
    this.plate = plate;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(ARROWS * 3 * 3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.dynamic = true;

    this.positionAttr = geometry.attributes.position;
    geometry.computeBoundingSphere();

    const material = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.6, transparent: true});
    this.root = new THREE.Mesh(geometry, material);
  }

  setPos(i, vector) {
    const pos = this.positionAttr.array;
    const idx = i * 3;
    pos[idx] = vector.x;
    pos[idx + 1] = vector.y;
    pos[idx + 2] = vector.z;
  }

  updateArrows() {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(this.plate.eulerPole, -this.plate.angularSpeed * LENGTH_SCALE);
    const fields = this.plate.fields;
    for (let i = 0; i < ARROWS; i += 1) {
      const vi = i * 3;
      const field = fields.get(i);
      if (field) {
        const pos = field.localPos;
        const prevPos = pos.clone().applyMatrix4(rotationMatrix);
        const diff = pos.clone().sub(prevPos);
        const sideOffset = diff.clone().cross(pos).setLength(WIDTH);
        this.setPos(vi, pos.clone().add(sideOffset));
        this.setPos(vi + 1, pos.clone().add(diff));
        this.setPos(vi + 2, pos.clone().sub(sideOffset));
      } else {
        this.setPos(vi, NULL_POS);
        this.setPos(vi + 1, NULL_POS);
        this.setPos(vi + 2, NULL_POS);
      }
    }
    this.positionAttr.needsUpdate = true;
  }
}
