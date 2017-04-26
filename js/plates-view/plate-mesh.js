import * as THREE from 'three';
import { plateColor } from './colormaps';
import vertexShader from './plate-mesh-vertex.glsl';
import fragmentShader from './plate-mesh-fragment.glsl';

const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  transparent: true
});

export default class PlateMesh {
  constructor(plate) {
    let vfc; // vertices, faces and colors
    // Actually it's fully synchronous function, but API is a bit overspoken.
    plate.sphere.toCG({colorFn: plateColor, type: 'poly-per-field'}, (err, _vfc) => {
      vfc = _vfc;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(vfc.indices, 1));
    geometry.addAttribute('position', new THREE.BufferAttribute(vfc.positions, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(vfc.normals, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(vfc.colors, 4));
    geometry.attributes.color.dynamic = true;

    geometry.computeBoundingSphere();

    this.geometry = geometry;

    this.root = new THREE.Object3D();
    this.root.add(new THREE.Mesh(this.geometry, material));
  }
}
