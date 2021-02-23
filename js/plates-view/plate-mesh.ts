import * as THREE from "three";
import vertexShader from "./plate-mesh-vertex.glsl";
import fragmentShader from "./plate-mesh-fragment.glsl";
import VectorField from "./vector-field";
import ForceArrow from "./force-arrow";
import TemporalEvents from "./temporal-events";
import { earthquakeTexture, depthToColor, magnitudeToSize } from "./earthquake-helpers";
import { volcanicEruptionTexture } from "./volcanic-eruption-helpers";
import PlateLabel from "./plate-label";
import { hueAndElevationToRgb, rgbToHex, topoColor } from "../colormaps";
import config from "../config";
import getGrid from "../plates-model/grid";
import { autorun, observe } from "mobx";

const MIN_SPEED_TO_RENDER_POLE = 0.002;
// Render every nth velocity arrow (performance).
const VELOCITY_ARROWS_DIVIDER = 3;
const BOUNDARY_COLOR = { r: 0.8, g: 0.2, b: 0.5, a: 1 };
// Constants below define order of rendering (like z-index):
const PLATE_RADIUS = 1;
const LAYER_DIFF = 0.0015;
const EARTHQUAKE_RADIUS = PLATE_RADIUS + LAYER_DIFF;
const VOLCANIC_ERUPTION_RADIUS = EARTHQUAKE_RADIUS + LAYER_DIFF;

function equalColors(c1: any, c2: any) {
  return c1 && c2 && c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}

function getMaterial() {
  // Easiest way to modify THREE built-in material:
  const material = new THREE.MeshPhongMaterial({
    // @ts-expect-error type unknown
    type: "MeshPhongMaterialWithAlphaChannel",
    transparent: true
  });
  (material as any).uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
  (material as any).vertexShader = vertexShader;
  (material as any).fragmentShader = fragmentShader;
  material.alphaTest = 0.2;
  if (config.bumpMapping) {
    material.bumpMap = new THREE.TextureLoader().load("data/mountains.jpg");
  }
  return material;
}

function axisOfRotation(color: any) {
  const geometry = new THREE.CylinderGeometry(0.01, 0.01, 2.2);
  const material = new THREE.MeshPhongMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

const SHARED_MATERIAL = getMaterial();

export default class PlateMesh {
  axis: any;
  basicMesh: any;
  colorAttr: any;
  currentColor: any;
  earthquakes: any;
  forceArrow: any;
  forces: any;
  geometry: any;
  helpersColor: any;
  label: any;
  observerDispose: any;
  plateId: any;
  root: any;
  store: any;
  velocities: any;
  vertexBumpScaleAttr: any;
  visibleFields: any;
  volcanicEruptions: any;

  constructor(plateId: any, store: any) {
    this.plateId = plateId;
    this.store = store;

    this.basicMesh = this.basicPlateMesh();
    this.colorAttr = this.basicMesh.geometry.attributes.color;
    this.vertexBumpScaleAttr = this.basicMesh.geometry.attributes.vertexBumpScale;

    // Structures used for performance optimization (see #updateFields method).
    this.currentColor = {};
    this.visibleFields = new Set();

    this.root = new THREE.Object3D();
    this.root.add(this.basicMesh);

    // Color used by various arrows and shapes related to plate (e.g. Euler pole or force arrow).
    this.helpersColor = rgbToHex(hueAndElevationToRgb(this.plate.hue, 1.0));

    this.axis = axisOfRotation(this.helpersColor);
    this.root.add(this.axis);

    this.velocities = new VectorField(0xffffff, Math.ceil(getGrid().size / VELOCITY_ARROWS_DIVIDER));
    this.root.add(this.velocities.root);

    // Per-field forces calculated by physics engine, mostly related to drag and orogeny.
    this.forces = new VectorField(0xff0000, getGrid().size);
    this.root.add(this.forces.root);

    this.earthquakes = new TemporalEvents(Math.ceil(getGrid().size), earthquakeTexture(), true);
    this.root.add(this.earthquakes.root);
    this.volcanicEruptions = new TemporalEvents(Math.ceil(getGrid().size), volcanicEruptionTexture());
    this.root.add(this.volcanicEruptions.root);

    // User-defined force that drives motion of the plate.
    this.forceArrow = new ForceArrow(this.helpersColor);
    this.root.add(this.forceArrow.root);

    // Point label showing the ID of the plate
    this.label = new PlateLabel(this.plate);
    this.root.add(this.label.root);

    // Reflect density and subduction order in rendering.
    this.radius = PlateMesh.getRadius(this.plate.density);

    this.observeStore(store);
  }

  get plate() {
    return this.store.model.getPlate(this.plateId);
  }

  observeStore(store: any) {
    this.observerDispose = [];
    this.observerDispose.push(autorun(() => {
      SHARED_MATERIAL.wireframe = store.wireframe;
      this.velocities.visible = store.renderVelocities;
      this.forces.visible = store.renderForces;
      this.earthquakes.visible = store.earthquakes;
      this.volcanicEruptions.visible = store.volcanicEruptions;
      this.forceArrow.visible = store.renderHotSpots;
      this.label.visible = store.renderPlateLabels;
      this.axis.visible = store.renderEulerPoles;
      this.updatePlateAndFields();
    }));

    // Most of the PlateStore properties and none of the FieldStore properties are observable (due to performance reasons).
    // The only observable property is #dataUpdateID which gets incremented each time a new data from model worker is
    // received. If that happens, we need to update all views based on PlateStore and FieldStore properties.
    this.observerDispose.push(observe(this.plate, "dataUpdateID", () => {
      this.updatePlateAndFields();
    }));
  }

  static getRadius(density: any) {
    // Denser plates should be rendered lower down, so they they are hidden when they subduct
    return PLATE_RADIUS - density / 1000;
  }

  set radius(v) {
    // Scale instead of modifying geometry.
    this.root.scale.set(v, v, v);
  }

  get radius() {
    return this.root.scale.x;
  }

  dispose() {
    this.geometry.dispose();
    this.axis.geometry.dispose();
    this.axis.material.dispose();
    this.velocities.dispose();
    this.forces.dispose();
    this.earthquakes.dispose();
    this.volcanicEruptions.dispose();
    this.forceArrow.dispose();
    this.label.dispose();
    this.observerDispose.forEach((dispose: any) => dispose());
    this.observerDispose.length = 0;
  }

  basicPlateMesh() {
    const attributes = getGrid().getGeometryAttributes();
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setIndex(new THREE.BufferAttribute(attributes.indices, 1));
    this.geometry.setAttribute("position", new THREE.BufferAttribute(attributes.positions, 3));
    this.geometry.setAttribute("normal", new THREE.BufferAttribute(attributes.normals, 3));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(attributes.uvs, 2));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(attributes.colors, 4));
    this.geometry.setAttribute("vertexBumpScale", new THREE.BufferAttribute(new Float32Array(attributes.positions.length / 2), 1));
    this.geometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.vertexBumpScale.setUsage(THREE.DynamicDrawUsage);

    this.geometry.computeBoundingSphere();

    return new THREE.Mesh(this.geometry, SHARED_MATERIAL);
  }

  updatePlateAndFields() {
    this.radius = PlateMesh.getRadius(this.plate.density);
    this.basicMesh.setRotationFromQuaternion(this.plate.quaternion);
    if (this.store.renderEulerPoles) {
      if (this.plate.angularSpeed > MIN_SPEED_TO_RENDER_POLE) {
        this.axis.visible = true;
        this.axis.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.plate.axisOfRotation);
      } else {
        this.axis.visible = false;
      }
    }
    if (this.store.renderHotSpots) {
      this.forceArrow.update(this.plate.hotSpot);
    }
    this.label.update(this.plate);
    this.updateFields();
  }

  fieldColor(field: any) {
    if (this.store.renderBoundaries && field.boundary) {
      return BOUNDARY_COLOR;
    }
    if (this.store.colormap === "topo") {
      return topoColor(field.elevation);
    } else if (this.store.colormap === "plate") {
      return hueAndElevationToRgb(field.originalHue || this.plate.hue, field.elevation);
    } else if (this.store.colormap === "age") {
      return hueAndElevationToRgb(field.originalHue || this.plate.hue, 1 - field.normalizedAge);
    }
  }

  updateFieldAttributes(field: any) {
    const colors = this.colorAttr.array;
    const vBumpScale = this.vertexBumpScaleAttr.array;
    const sides = getGrid().neighboursCount(field.id);
    const color = this.fieldColor(field);
    if (!color || equalColors(color, this.currentColor[field.id])) {
      return;
    } else {
      this.currentColor[field.id] = color;
    }
    const c = getGrid().getFirstVertex(field.id);
    for (let s = 0; s < sides; s += 1) {
      const cc = (c + s);
      colors[cc * 4] = color.r;
      colors[cc * 4 + 1] = color.g;
      colors[cc * 4 + 2] = color.b;
      colors[cc * 4 + 3] = color.a;

      // This equation defines bump mapping of the terrain.
      // Elevation.
      let bump = field.elevation && Math.max(0.0025, Math.pow(field.elevation - 0.43, 3));
      if (field.normalizedAge < 1) {
        // Make oceanic ridges bumpy too.
        bump += (1 - field.normalizedAge) * 0.1;
      }
      vBumpScale[cc] = bump;
    }
    this.colorAttr.needsUpdate = true;
    this.vertexBumpScaleAttr.needsUpdate = true;
  }

  hideField(field: any) {
    const colors = this.colorAttr.array;
    this.currentColor[field.id] = null;
    const sides = getGrid().neighboursCount(field.id);
    const c = getGrid().getFirstVertex(field.id);
    for (let s = 0; s < sides; s += 1) {
      const cc = (c + s);
      // set alpha channel to 0.
      colors[cc * 4 + 3] = 0;
    }
  }

  updateFields() {
    const { renderVelocities, renderForces, earthquakes, volcanicEruptions } = this.store;
    const fieldFound: Record<string, boolean> = {};
    this.plate.forEachField((field: any) => {
      fieldFound[field.id] = true;
      if (!this.visibleFields.has(field)) {
        this.visibleFields.add(field);
      }
      this.updateFieldAttributes(field);
      if (renderVelocities && field.id % VELOCITY_ARROWS_DIVIDER === 0) {
        this.velocities.setVector(field.id / VELOCITY_ARROWS_DIVIDER, field.linearVelocity, field.absolutePos);
      }
      if (renderForces) {
        this.forces.setVector(field.id, field.force, field.absolutePos);
      }
      if (earthquakes) {
        const visible = field.earthquakeMagnitude > 0;
        this.earthquakes.setProps(field.id, {
          visible,
          // Note that we still need to update position if earthquake is invisible, as there might be an ease-out transition in progress.
          position: field.absolutePos.clone().setLength(EARTHQUAKE_RADIUS),
          color: visible ? depthToColor(field.earthquakeDepth) : null,
          size: visible ? magnitudeToSize(field.earthquakeMagnitude) : null
        });
      }
      if (volcanicEruptions) {
        this.volcanicEruptions.setProps(field.id, {
          visible: field.volcanicEruption,
          // Note that we still need to update position if eruption is invisible, as there might be an ease-out transition in progress.
          position: field.absolutePos.clone().setLength(VOLCANIC_ERUPTION_RADIUS),
          size: field.volcanicEruption ? 0.016 : null
        });
      }
    });
    // Process fields that are still visible, but no longer part of the plate model.
    this.visibleFields.forEach((field: any) => {
      if (!fieldFound[field.id]) {
        this.visibleFields.delete(field);
        this.hideField(field);
        if (renderVelocities && field.id % VELOCITY_ARROWS_DIVIDER === 0) {
          this.velocities.clearVector(field.id / VELOCITY_ARROWS_DIVIDER);
        }
        if (renderForces) {
          this.forces.clearVector(field.id);
        }
        if (earthquakes) {
          this.earthquakes.setProps(field.id, { visible: false });
        }
        if (volcanicEruptions) {
          this.volcanicEruptions.setProps(field.id, { visible: false });
        }
      }
    });
  }

  updateTransitions(progress: any) {
    this.earthquakes.updateTransitions(progress);
    this.volcanicEruptions.updateTransitions(progress);
  }
}
