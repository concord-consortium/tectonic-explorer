import * as THREE from 'three';
import grid from '../plates-model/grid';

const ARROWS_COUNT = grid.size;
const WIDTH = 0.004;
const NULL_POS = {x: 0, y: 0, z: 0};
const MIN_LENGTH = 0.0001;
const MULT = {
  'force': 1
};

export default class VectorField {
  constructor(fields, property, color = 0xffffff) {
    this.fields = fields;
    this.property = property;

    const geometry = new THREE.BufferGeometry();
    // * 3 * 3 => 3 vertices per arrow (triangle), each vertex has 3 coordinates (x, y, z).
    const positions = new Float32Array(ARROWS_COUNT * 3 * 3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.dynamic = true;

    this.positionAttr = geometry.attributes.position;
    geometry.computeBoundingSphere();

    const material = new THREE.MeshBasicMaterial({color, opacity: 0.6, transparent: true});
    this.root = new THREE.Mesh(geometry, material);
  }

  setPos(i, vector) {
    const pos = this.positionAttr.array;
    const idx = i * 3;
    pos[idx] = vector.x;
    pos[idx + 1] = vector.y;
    pos[idx + 2] = vector.z;
  }

  update() {
    const fields = this.fields;
    for (let i = 0; i < ARROWS_COUNT; i += 1) {
      const vi = i * 3;
      const field = fields.get(i);
      const vector = field && field[this.property] && field[this.property].clone();
      if (vector) {
        vector.multiplyScalar(MULT[this.property] || 1)
      }
      if (vector && vector.length() > MIN_LENGTH) {
        const pos = field.absolutePos;
        const sideOffset = vector.clone().cross(pos).setLength(WIDTH);
        this.setPos(vi, pos.clone().add(sideOffset));
        this.setPos(vi + 1, pos.clone().add(vector));
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
