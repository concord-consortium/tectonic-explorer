import * as THREE from "three";
import vertexShader from "./temporal-event-vertex.glsl";
import fragmentShader from "./temporal-event-fragment.glsl";
import config from "../config";

const colorHelper = new THREE.Color();
const NULL_POS = new THREE.Vector3(0, 0, 0);

// Generated using:
// http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm
function easeOutBounce(t: any) {
  const ts = t * t;
  const tc = ts * t;
  return 33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t;
}

function generateUVs(count: any) {
  // * 2 * 3 * 2 =>  2 * 3 vertices per rectangle (2 triangles to form a rectangle),
  // each uv 2 coordinates (u, v)
  const uvs = new Float32Array(count * 2 * 3 * 2);
  const set = (i: any, u: any, v: any) => {
    const idx = i * 2;
    uvs[idx] = u;
    uvs[idx + 1] = v;
  };
  for (let i = 0; i < count; i += 1) {
    const vi = i * 6;
    // triangle 1
    set(vi, 1, 1);
    set(vi + 1, 0, 1);
    set(vi + 2, 0, 0);
    // triangle 2
    set(vi + 3, 0, 0);
    set(vi + 4, 1, 0);
    set(vi + 5, 1, 1);
  }
  return uvs;
}

// Helper class that accepts any texture (and alpha map) and lets you easily show and hide it with a nice transition.
// Used to render earthquakes and volcanic eruptions.
export default class TemporalEvents {
  count: number;
  currentVisibility: Float32Array;
  targetVisibility: Float32Array;
  customColorAttr: THREE.BufferAttribute;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3[];
  positionNeedsUpdate: boolean[];
  positionAttr: THREE.BufferAttribute;
  root: THREE.Object3D;
  size: number[];
  sizeNeedsUpdate: boolean[];
  texture: THREE.Texture;

  constructor(count: number, texture: THREE.Texture, customColorPerObject?: boolean) {
    this.count = count;
    this.texture = texture;

    this.geometry = new THREE.BufferGeometry();
    // * 3 * 3 * 2 =>  2 * 3 vertices per rectangle (2 triangles to form a rectangle),
    // each vertex has 3 coordinates (x, y, z).
    const positions = new Float32Array(count * 3 * 3 * 2);
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.positionAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    this.positionAttr.setUsage(THREE.DynamicDrawUsage);

    // UVs to map texture onto rectangle.
    const uvs = generateUVs(count);
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    // If customColorPerObject is equal to true, every object can have different color provided via #setProps.
    // This color will be multiplied by texture colors, so the texture should have white areas in spots where
    // the custom color should be applied.
    if (customColorPerObject) {
      // * 3 * 3 * 2 =>  2 * 3 vertices per rectangle (2 triangles to form a rectangle),
      // each vertex has 3 values (r, g, b).
      const customColors = new Float32Array(count * 3 * 3 * 2);
      this.geometry.setAttribute("customColor", new THREE.BufferAttribute(customColors, 3));
      this.customColorAttr = this.geometry.attributes.customColor as THREE.BufferAttribute;
      this.customColorAttr.setUsage(THREE.DynamicDrawUsage);

      // Use custom shaders that handle custom color per object.
      this.material = new THREE.ShaderMaterial({
        uniforms: { textureUniform: { value: this.texture } },
        vertexShader,
        fragmentShader,
        transparent: true,
        alphaTest: 0.5
      });
    } else {
      this.material = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        alphaTest: 0.5
      });
    }

    this.geometry.computeBoundingSphere();

    this.root = new THREE.Mesh(this.geometry, this.material);

    this.size = [];
    this.sizeNeedsUpdate = [];
    this.position = [];
    this.positionNeedsUpdate = [];
    this.targetVisibility = new Float32Array(count);
    this.currentVisibility = new Float32Array(count);
  }

  set visible(v: any) {
    this.root.visible = v;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }

  setVertexPos(i: number, vector: THREE.Vector3) {
    const pos = this.positionAttr.array as Float32Array;
    const idx = i * 3;
    pos[idx] = vector.x;
    pos[idx + 1] = vector.y;
    pos[idx + 2] = vector.z;
  }

  setVertexColor(i: number, value: number) {
    if (!this.customColorAttr) {
      throw new Error("Custom color per object mode is not available.");
    }
    colorHelper.setHex(value);
    colorHelper.toArray(this.customColorAttr.array, i * 3);
  }

  setProps(idx: number, {
    visible,
    position = null,
    color = null,
    size = null
  }: {
    visible: boolean;
    position: THREE.Vector3 | null;
    color: number | null;
    size: number | null;
  }) {
    this.targetVisibility[idx] = visible ? 1 : 0;
    if (position !== null && !this.position[idx]?.equals(position)) {
      this.position[idx] = position;
      this.positionNeedsUpdate[idx] = true;
    }
    if (size !== null && this.size[idx] !== size) {
      this.size[idx] = size;
      this.sizeNeedsUpdate[idx] = true;
    }
    if (color !== null) {
      this.setColor(idx, color);
    }
  }

  setPositionAndSize(idx: number, size: number) {
    const vi = idx * 6;
    const pos = this.position[idx];
    if (!pos) {
      return;
    }
    // Cross product with any random, non-parallel vector will result in a perpendicular vector.
    // Adding some value to Y component ensures it's not parallel and the resulting vector will point towards north.
    const randVec = new THREE.Vector3(pos.x, pos.y + 1, pos.z).applyAxisAngle(pos, -Math.PI * 0.5);
    const prependVec1 = pos.clone().cross(randVec);
    // Cross product of two vectors will result in a vector perpendicular to both.
    const prependVec2 = prependVec1.clone().cross(pos);
    prependVec1.setLength(size);
    prependVec2.setLength(size);
    // Generate square.
    const p1 = pos.clone().add(prependVec1).add(prependVec2);
    const p2 = pos.clone().add(prependVec1).sub(prependVec2);
    const p3 = pos.clone().sub(prependVec1).sub(prependVec2);
    const p4 = pos.clone().sub(prependVec1).add(prependVec2);
    // triangle 1
    this.setVertexPos(vi, p1);
    this.setVertexPos(vi + 1, p2);
    this.setVertexPos(vi + 2, p3);
    // triangle 3
    this.setVertexPos(vi + 3, p3);
    this.setVertexPos(vi + 4, p4);
    this.setVertexPos(vi + 5, p1);
    this.positionAttr.needsUpdate = true;
  }

  setColor(idx: number, color: number) {
    const vi = idx * 6;
    // triangle 1
    this.setVertexColor(vi, color);
    this.setVertexColor(vi + 1, color);
    this.setVertexColor(vi + 2, color);
    // triangle 2
    this.setVertexColor(vi + 3, color);
    this.setVertexColor(vi + 4, color);
    this.setVertexColor(vi + 5, color);
    this.customColorAttr.needsUpdate = true;
  }

  hide(idx: number) {
    const vi = idx * 6;
    // triangle 1
    this.setVertexPos(vi, NULL_POS);
    this.setVertexPos(vi + 1, NULL_POS);
    this.setVertexPos(vi + 2, NULL_POS);
    // triangle 2
    this.setVertexPos(vi + 3, NULL_POS);
    this.setVertexPos(vi + 4, NULL_POS);
    this.setVertexPos(vi + 5, NULL_POS);

    this.targetVisibility[idx] = 0;
    this.currentVisibility[idx] = 0;

    this.positionAttr.needsUpdate = true;
  }

  updateTransitions(progress: number) {
    progress /= config.tempEventTransitionTime; // map to [0, 1]
    for (let i = 0; i < this.count; i += 1) {
      if (this.positionNeedsUpdate[i] || this.sizeNeedsUpdate[i] || this.currentVisibility[i] !== this.targetVisibility[i]) {
        this.currentVisibility[i] += this.currentVisibility[i] < this.targetVisibility[i] ? progress : -progress;
        this.currentVisibility[i] = Math.max(0, Math.min(1, this.currentVisibility[i]));
        const size = easeOutBounce(this.currentVisibility[i]) * this.size[i];
        if (size === 0) {
          this.hide(i);
        } else {
          this.setPositionAndSize(i, size);
        }
        this.positionNeedsUpdate[i] = false;
        this.sizeNeedsUpdate[i] = false;
      }
    }
  }
}
