import * as THREE from 'three';
import { plateColor } from './colormaps';
import vertexShader from './plate-mesh-vertex.glsl';
import fragmentShader from './plate-mesh-fragment.glsl';
import grid from '../plates-model/grid';

// Easiest way to modify THREE built-in material:
const material = new THREE.MeshPhongMaterial({
  type: 'MeshPhongMaterialWithAlphaChannel'
});
material.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
material.vertexShader = vertexShader;
material.fragmentShader = fragmentShader;
material.alphaTest = 0.2;

const mantleColor = {r: 0.9, g: 0.1, b: 0.1, a: 1};

export default class ModelGridMesh {
  constructor(model) {
    this.model = model;

    const attributes = grid.getGeometryAttributes();
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(attributes.indices, 1));
    geometry.addAttribute('position', new THREE.BufferAttribute(attributes.positions, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(attributes.normals, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(attributes.colors, 4));
    geometry.attributes.color.dynamic = true;

    geometry.computeBoundingSphere();

    this.geometry = geometry;

    const mesh = new THREE.Mesh(this.geometry, material);
    const scale = 0.98;
    mesh.scale.set(scale, scale, scale);
    this.root = new THREE.Object3D();
    this.root.add(mesh);

    this.updateColors();
  }

  get colorAttr() {
    return this.geometry.attributes.color;
  }

  fieldColor(fields) {
    if (!fields) return mantleColor;
    return plateColor(fields[0].plate.id);
  }

  updateColors() {
    const colors = this.colorAttr.array;
    const nPolys = grid.fields.length;
    let c = 0;
    for (let f = 0; f < nPolys; f += 1) {
      const fields = this.model.gridMapping[f];
      const sides = grid.neighboursCount(f);
      const color =  this.fieldColor(fields);
      for (let s = 0; s < sides; s += 1) {
        let cc = (c + s);
        colors[cc * 4] = color.r;
        colors[cc * 4 + 1] = color.g;
        colors[cc * 4 + 2] = color.b;
        colors[cc * 4 + 3] = color.a;
      }
      c += sides;
    }
    this.colorAttr.needsUpdate = true;
  }
}
