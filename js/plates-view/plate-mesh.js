import * as THREE from 'three';
import vertexShader from './plate-mesh-vertex.glsl';
import fragmentShader from './plate-mesh-fragment.glsl';
import VectorField from './vector-field';
import { hsv } from 'd3-hsv';
import { colorObj, rgbToHex } from '../colormaps';
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
if (config.bumpMapping) {
  const mapHeight = new THREE.TextureLoader().load('data/mountains.png');
  mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping;
  mapHeight.repeat.set(7, 7);
  material.bumpMap = mapHeight;
  material.bumpScale = 0.1;
}

const transparent = {r: 0, g: 0, b: 0, a: 0};
const collisionColor = {r: 1, g: 1, b: 0.1, a: 1};
const subductionColor = {r: 0.2, g: 0.2, b: 0.5, a: 1};
const borderColor = {r: 0.1, g: 1, b: 0.1, a: 1};

const BASE_HSV_VALUE = 0.2;
function hsvToRgb(col, val = 0) {
  // So: for val = 0, we'll use v = BASE_HSV_VALUE, for val = 1, we'll use v = 1.
  const rgb = hsv(col.h, col.s, BASE_HSV_VALUE + val * (1 - BASE_HSV_VALUE)).rgb();
  return colorObj(rgb);
}

const MIN_SPEED_TO_RENDER_POLE = 0.002;

export default class PlateMesh {
  constructor(plate) {
    this.plate = plate;
    this.baseColor = hsvToRgb(this.plate.baseColor, 0);
    this.adjacentFieldColor = Object.assign({}, this.baseColor, {a: 0.5});

    this.basicMesh = this.basicPlateMesh();
    this.colorAttr = this.basicMesh.geometry.attributes.color;
    this.vertexBumpScaleAttr = this.basicMesh.geometry.attributes.vertexBumpScale;

    this.root = new THREE.Object3D();
    // Reflect density and subduction order in rendering.
    const scale = 1 + this.plate.density / 1000;
    this.root.scale.set(scale, scale, scale);

    this.root.add(this.basicMesh);

    if (config.renderEulerPoles) {
      this.axis = this.axisOfRotation();
      this.root.add(this.axis);
    }

    if (config.renderVelocities) {
      this.velocities = new VectorField(plate.fields, 'linearVelocity', 0xffffff);
      this.root.add(this.velocities.root);
    }
    if (config.renderForces) {
      this.forces = new VectorField(plate.fields, 'force', 0xff0000);
      this.root.add(this.forces.root);
    }

    this.update();
  }

  basicPlateMesh() {
    const attributes = grid.getGeometryAttributes();
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(attributes.indices, 1));
    geometry.addAttribute('position', new THREE.BufferAttribute(attributes.positions, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(attributes.normals, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(attributes.uvs, 2));
    geometry.addAttribute('color', new THREE.BufferAttribute(attributes.colors, 4));
    geometry.addAttribute('vertexBumpScale', new THREE.BufferAttribute(new Float32Array(attributes.positions.length / 2), 1));
    geometry.attributes.color.dynamic = true;
    geometry.attributes.vertexBumpScale.dynamic = true;

    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  axisOfRotation() {
    const geometry = new THREE.CylinderGeometry(0.01, 0.01, 2.2);
    const material = new THREE.MeshPhongMaterial({color: rgbToHex(hsvToRgb(this.plate.baseColor, 0.8))});
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  fieldColor(field) {
    if (config.renderCollisions) {
      if (field.subduction) return subductionColor;
      if (field.collision) return collisionColor;
    }
    return hsvToRgb(this.plate.baseColor, field.elevation);
  }

  update() {
    this.basicMesh.rotation.setFromRotationMatrix(this.plate.matrix);
    if (this.velocities) {
      this.velocities.update();
    }
    if (this.forces) {
      this.forces.update();
    }
    if (this.axis) {
      if (this.plate.angularSpeed > MIN_SPEED_TO_RENDER_POLE) {
        this.axis.visible = true;
        this.axis.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.plate.axisOfRotation);
      } else {
        this.axis.visible = false;
      }
    }
    this.updateAttributes();
  }

  updateAttributes() {
    const colors = this.colorAttr.array;
    const vBumpScale = this.vertexBumpScaleAttr.array;
    const nPolys = grid.fields.length;
    let c = 0;
    for (let f = 0; f < nPolys; f += 1) {
      const field = this.plate.fields.get(f);
      const sides = grid.neighboursCount(f);
      let color = field ? this.fieldColor(field) : transparent;
      if (config.renderAdjacentFields && !field && this.plate.adjacentFields.has(f)) {
        color = this.adjacentFieldColor;
      }
      for (let s = 0; s < sides; s += 1) {
        let cc = (c + s);
        colors[cc * 4] = color.r;
        colors[cc * 4 + 1] = color.g;
        colors[cc * 4 + 2] = color.b;
        colors[cc * 4 + 3] = color.a;

        vBumpScale[cc] = field && Math.max(0, field.elevation - 0.6);
      }

      c += sides;
    }
    this.colorAttr.needsUpdate = true;
    this.vertexBumpScaleAttr.needsUpdate = true;
  }
}
