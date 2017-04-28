import * as THREE from 'three';
import { plateColor } from './colormaps';
import vertexShader from './plate-mesh-vertex.glsl';
import fragmentShader from './plate-mesh-fragment.glsl';
import config from '../config';

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

export default class PlateMesh {
  constructor(plate) {
    this.plate = plate;

    let vfc; // vertices, faces and colors
    // Actually it's fully synchronous function, but API is a bit overspoken.
    this.plate.sphere.toCG({colorFn: () => transparent, type: 'poly-per-field'}, (err, _vfc) => {
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

    const mesh = new THREE.Mesh(this.geometry, material);
    const scale = 1 - plate.id / 1000;
    mesh.scale.set(scale, scale, scale);
    this.root = new THREE.Object3D();
    this.root.add(mesh);

    this.updateColors();
  }

  get colorAttr() {
    return this.geometry.attributes.color;
  }

  fieldColor(field) {
    if (!field.data.active) return transparent;
    if (field.data.collision) return collisionColor;
    return plateColor(this.plate.id);
  }

  updateRotation() {
    this.root.rotation.setFromRotationMatrix(this.plate.matrix);
  }

  updateColors() {
    const colors = this.colorAttr.array;
    const nPolys = this.plate.fields.length;
    let c = 0;
    for (let f = 0; f < nPolys; f += 1) {
      const field = this.plate.fields[f];
      const sides = field._adjacentFields.length;
      const color = this.fieldColor(field);
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
