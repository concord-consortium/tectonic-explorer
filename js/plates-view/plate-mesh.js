import * as THREE from 'three';
import vertexShader from './plate-mesh-vertex.glsl';
import fragmentShader from './plate-mesh-fragment.glsl';
import config from '../config';
import grid from '../plates-model/grid';

// Easiest way to modify THREE built-in material:
const material = new THREE.MeshPhongMaterial({
  type: 'MeshPhongMaterialWithAlphaChannel',
  transparent: true,
  wireframe: config.wireframe
});
material.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
material.vertexShader = vertexShader;
material.fragmentShader = fragmentShader;
material.alphaTest = 0.2;

const transparent = {r: 0, g: 0, b: 0, a: 0};
const collisionColor = {r: 1, g: 1, b: 0.1, a: 1};
const subductionColor = {r: 0.1, g: 0.1, b: 1, a: 1};
const borderColor = {r: 0.1, g: 1, b: 0.1, a: 1};

export default class PlateMesh {
  constructor(plate) {
    this.plate = plate;

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
    // Reflect density and subduction order in rednering.
    const scale = 1 + plate.density / 1000;
    mesh.scale.set(scale, scale, scale);
    this.root = new THREE.Object3D();
    this.root.add(mesh);

    this.updateColors();
  }

  get colorAttr() {
    return this.geometry.attributes.color;
  }

  fieldColor(field) {
    if (field.subduction) return subductionColor;
    if (field.collision) return collisionColor;
    return this.plate.baseColor;
  }

  updateRotation() {
    this.root.rotation.setFromRotationMatrix(this.plate.matrix);
  }

  updateColors() {
    const colors = this.colorAttr.array;
    const nPolys = grid.fields.length;
    let c = 0;
    for (let f = 0; f < nPolys; f += 1) {
      const field = this.plate.fields.get(f);
      const sides = grid.neighboursCount(f);
      const color = field ? this.fieldColor(field) : transparent;
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
