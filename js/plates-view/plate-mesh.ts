import * as THREE from "three";
import vertexShader from "./plate-mesh-vertex.glsl";
import fragmentShader from "./plate-mesh-fragment.glsl";
import VectorField from "./vector-field";
import ForceArrow from "./force-arrow";
import TemporalEvents from "./temporal-events";
import { earthquakeTexture, depthToColor, magnitudeToSize } from "./earthquake-helpers";
import { volcanicEruptionTexture } from "./volcanic-eruption-helpers";
import PlateLabel from "./plate-label";
import { hueAndElevationToRgb, rgbToHex, rockColorRGBA, topoColorFromNormalized, MAX_ELEVATION, MIN_ELEVATION, normalizeElevation, RGBA } from "../colormaps";
import config from "../config";
import getGrid from "../plates-model/grid";
import { autorun, observe } from "mobx";
import { SimulationStore } from "../stores/simulation-store";
import PlateStore from "../stores/plate-store";
import FieldStore from "../stores/field-store";
import { Rock } from "../plates-model/crust";

const MIN_SPEED_TO_RENDER_POLE = 0.002;
// Render every nth velocity arrow (performance).
const VELOCITY_ARROWS_DIVIDER = 3;
const BOUNDARY_COLOR = { r: 0.8, g: 0.2, b: 0.5, a: 1 };
// Special color value that indicates that colormap texture should be used.
const USE_COLORMAP_COLOR = { r: 0, g: 0, b: 0, a: 0 };
// Larger value will make mountains in the 3D view more pronounced.
const ELEVATION_SCALE = 0.06;

// PLATE_RADIUS reflects radius of the geodesic mesh in view units. This value should not be changed unless
// geodesic grid is updated too.
export const PLATE_RADIUS = 1;

// Constants below define order of rendering (like z-index):
const LAYER_DIFF = 0.004;
const EARTHQUAKES_LAYER_DIFF = 1 * LAYER_DIFF;
const VOLCANIC_ERUPTIONS_LAYER_DIFF = 2 * LAYER_DIFF;

function getElevationInViewUnits(elevation: number) {
  return elevation * ELEVATION_SCALE;
}

function colToHex(c: any) {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
}

function getMaterial() {
  // Easiest way to modify THREE built-in material:
  const material: any = new THREE.MeshPhongMaterial({
    // `type` prop is not declared by THREE types, as it probably shouldn't be used. It's a workaround to generate 
    // a custom material based on Mesh Phong.
    // @ts-expect-error `type` prop is not declared by THREE types
    type: "MeshPhongMaterialWithAlphaChannel",
    transparent: true
  });
  material.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
  material.uniforms.colormap = { value: null };
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.alphaTest = 0.1;
  if (config.bumpMapping) {
    material.bumpMap = new THREE.TextureLoader().load("data/mountains.jpg");
  }
  material.flatShading = config.flatShading;
  return material;
}

function axisOfRotation(color: any) {
  const geometry = new THREE.CylinderGeometry(0.01, 0.01, 2.2);
  const material = new THREE.MeshPhongMaterial({ color });
  return new THREE.Mesh(geometry, material);
}


function getTopoColormap() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  const height = config.topoColormapShades;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d context not available");
  }
  for (let i = 0; i <= height; i += 1) {
    const normalizedElevation = i / height;
    ctx.fillStyle = colToHex(topoColorFromNormalized(normalizedElevation));
    ctx.fillRect(0, height - i, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (config.topoColormapShades < 200) {
    // If number of shades is relatively small, use NearestFilter as it'll ensure that colors are not interpolated
    // and they look like a real topographic map.
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  }
  return texture;
}

function getPlateColormap(plateHue: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  const height = config.topoColormapShades;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d context not available");
  }
  const elevRange = MAX_ELEVATION - MIN_ELEVATION;
  for (let i = 0; i <= height; i += 1) {
    const normalizedElevation = i / height;
    ctx.fillStyle = colToHex(hueAndElevationToRgb(plateHue, normalizedElevation * elevRange + MIN_ELEVATION));
    ctx.fillRect(0, height - i, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (config.topoColormapShades < 200) {
    // If number of shades is relatively small, use NearestFilter as it'll ensure that colors are not interpolated
    // and they look like a real topographic map.
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  }
  return texture;
}

function getCrustAgeColormap(plateHue: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  const height = config.topoColormapShades;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d context not available");
  }
  for (let i = 0; i <= height; i += 1) {
    const normalizedAge = i / height;
    ctx.fillStyle = colToHex(hueAndElevationToRgb(plateHue, 1 - normalizedAge));
    ctx.fillRect(0, height - i, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (config.topoColormapShades < 200) {
    // If number of shades is relatively small, use NearestFilter as it'll ensure that colors are not interpolated
    // and they look like a real topographic map.
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  }
  return texture;
}

export default class PlateMesh {
  axis: any;
  basicMesh: any;
  colorAttr: any;
  earthquakes: any;
  forceArrow: any;
  forces: any;
  geometry: any;
  helpersColor: any;
  label: any;
  observerDispose: any;
  plateId: any;
  root: any;
  store: SimulationStore;
  velocities: any;
  vertexBumpScaleAttr: any;
  vertexElevationAttr: any;
  visibleFields: Set<FieldStore>;
  volcanicEruptions: any;

  material: THREE.RawShaderMaterial;
  topoColormap: THREE.Texture;
  plateColormap: THREE.Texture;
  crustAgeColormap: THREE.Texture;

  defaultColorAttr: RGBA;
  defaultColormapValue: number;

  constructor(plateId: any, store: SimulationStore) {
    this.plateId = plateId;
    this.store = store;

    this.material = getMaterial();
    this.basicMesh = this.basicPlateMesh();
    this.colorAttr = this.basicMesh.geometry.attributes.color;
    this.vertexBumpScaleAttr = this.basicMesh.geometry.attributes.vertexBumpScale;
    this.vertexElevationAttr = this.basicMesh.geometry.attributes.vertexElevation;

    this.topoColormap = getTopoColormap();
    this.plateColormap = getPlateColormap(this.plate.hue);
    this.crustAgeColormap = getCrustAgeColormap(this.plate.hue);

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

    this.setColormap();
  }

  get geoAttributes() {
    return this.basicMesh.geometry.attributes;
  }

  get verticesCount() {
    // Return length of any attribute that uses a single component (e.g. position attribute uses 3 components).
    return this.geoAttributes.colormapValue.array.length;
  }

  get plate() {
    return this.store.model.getPlate(this.plateId) as PlateStore;
  }

  observeStore(store: SimulationStore) {
    this.observerDispose = [];
    this.observerDispose.push(autorun(() => {
      this.root.visible = this.plate.visible;
      this.material.wireframe = store.wireframe;
      this.velocities.visible = store.renderVelocities;
      this.forces.visible = store.renderForces;
      this.earthquakes.visible = store.earthquakes;
      this.volcanicEruptions.visible = store.volcanicEruptions;
      this.forceArrow.visible = store.renderHotSpots;
      this.label.visible = store.renderPlateLabels;
      this.axis.visible = store.renderEulerPoles;
      this.updatePlateAndFields();
    }));

    this.observerDispose.push(observe(store, "colormap", () => {
      this.setColormap();
    }));

    // Most of the PlateStore properties and none of the FieldStore properties are observable (due to performance reasons).
    // The only observable property is #dataUpdateID which gets incremented each time a new data from model worker is
    // received. If that happens, we need to update all views based on PlateStore and FieldStore properties.
    this.observerDispose.push(observe(this.plate, "dataUpdateID", () => {
      this.updatePlateAndFields();
    }));
  }

  static getRadius(density: number) {
    return PLATE_RADIUS;
  }

  set radius(v) {
    // Scale instead of modifying geometry.
    this.root.scale.set(v, v, v);
  }

  get radius() {
    return this.root.scale.x;
  }

  dispose() {
    this.material.dispose();
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
    const verticesCount = attributes.positions.length / 3;
    this.geometry.setAttribute("vertexBumpScale", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("vertexElevation", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("vertexHidden", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("colormapValue", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.attributes.color.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.vertexBumpScale.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.vertexElevation.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.vertexHidden.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.colormapValue.setUsage(THREE.DynamicDrawUsage);
    // Hide all fields by default.
    for (let i = 0; i < verticesCount; i += 1) {
      this.geometry.attributes.vertexHidden.array[i] = 1;
    }

    this.geometry.computeBoundingSphere();

    return new THREE.Mesh(this.geometry, this.material);
  }

  setColormap() {
    const colormap = this.store.colormap;
    if (colormap === "topo") {
      this.material.uniforms.colormap.value = this.topoColormap;
      // Fields at the divergent boundary should have 0 elevation.
      this.defaultColormapValue = normalizeElevation(0);
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };
    } else if (colormap === "plate") {
      this.material.uniforms.colormap.value = this.plateColormap;
      // Fields at the divergent boundary should have 0 elevation.
      this.defaultColormapValue = normalizeElevation(0);
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };
    } else if (colormap === "age") {
      this.material.uniforms.colormap.value = this.crustAgeColormap;
      // Fields at the divergent boundary should have 0 age.
      this.defaultColormapValue = 0;
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };
    } else if (colormap === "rock") {
      this.defaultColormapValue = 0;
      // Fields at the divergent boundary should be made of basalt.
      this.defaultColorAttr = rockColorRGBA(Rock.Basalt);
    }

    // Default colors have been reset, so hide all the fields for a moment to set these default values.
    const fieldsCount = this.verticesCount;
    for (let i = 0; i < fieldsCount; i += 1) {
      this.hideField(i);
    }
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
      const hotSpot = this.plate.hotSpot;
      // Add elevation to arrow position.
      const elevation = getElevationInViewUnits(this.plate.fieldAtAbsolutePos(hotSpot.position)?.elevation || 0);
      this.forceArrow.update({
        force: hotSpot.force,
        position: hotSpot.position.clone().setLength(PLATE_RADIUS + elevation)
      });
    }
    this.label.update(this.plate);
    this.updateFields();
  }

  fieldColor(field: FieldStore) {
    if (this.store.renderBoundaries && field.boundary) {
      return BOUNDARY_COLOR;
    }
    if (this.store.colormap === "rock") {
      return rockColorRGBA(field.rockType);
    }
    // To use color attribute coloring:
    // if (this.store.colormap === "plate") {
    //   return hueAndElevationToRgb(field.originalHue || this.plate.hue, field.elevation);
    // }
    // if (this.store.colormap === "age") {
    //   return hueAndElevationToRgb(field.originalHue || this.plate.hue, 1 - field.normalizedAge);
    // } 
    // Other colormaps use colormap texture as values can be nicely interpolated in fragment shader (e.g. topo colormap).
    return USE_COLORMAP_COLOR;
  }

  updateFieldAttributes(field: FieldStore) {
    const colors = this.colorAttr.array;
    const vBumpScale = this.vertexBumpScaleAttr.array;
    const vElevation = this.vertexElevationAttr.array;
    const vHidden = this.geoAttributes.vertexHidden.array; 
    const vColormapVal = this.geoAttributes.colormapValue.array;

    const color = this.fieldColor(field);
    const cc = field.id; 

    vHidden[cc] = 0;

    colors[cc * 4] = color.r;
    colors[cc * 4 + 1] = color.g;
    colors[cc * 4 + 2] = color.b;
    colors[cc * 4 + 3] = color.a;

    const colormap = this.store.colormap;
    if (colormap === "topo" || colormap === "plate") {
      vColormapVal[cc] = normalizeElevation(field.elevation);
    } else if (colormap === "age") {
      vColormapVal[cc] = field.normalizedAge;
    }

    vElevation[cc] = getElevationInViewUnits(field.elevation);

    // This equation defines bump mapping of the terrain. It doesn't seem to work at the moment.
    let bump = field.elevation && Math.max(0.0025, Math.pow(field.elevation - 0.43, 3));
    if (field.normalizedAge < 1) {
      // Make oceanic ridges bumpy too.
      bump += (1 - field.normalizedAge) * 0.07;
    }
    vBumpScale[cc] = bump;

    this.colorAttr.needsUpdate = true;
    this.vertexBumpScaleAttr.needsUpdate = true;
    this.vertexElevationAttr.needsUpdate = true;

    this.geoAttributes.vertexHidden.needsUpdate = true;
    this.geoAttributes.colormapValue.needsUpdate = true;
  }

  hideField(fieldId: number) {
    this.geoAttributes.vertexHidden.array[fieldId] = 1;
    // It's important to reset elevation too. Hidden fields are actually used as a borders of visible fields.
    // If elevation is set to non-zero value, it can create strange effects (steep slope at the plate edge).
    this.geoAttributes.vertexElevation.array[fieldId] = 0;
    // The same thing applies to colors. Hidden field colo will affect border of the visible plate part.
    // Default colormap value should match color that is expected around mid ocean ridge where new fields are
    // added and connected to hidden fields. This color will be visible at the every edge of plate.
    // Reset colormap value attribute after colormap is updated for each fields.
    this.geoAttributes.colormapValue.array[fieldId] = this.defaultColormapValue;
    
    this.geoAttributes.color.array[fieldId * 4] = this.defaultColorAttr.r;
    this.geoAttributes.color.array[fieldId * 4 + 1] = this.defaultColorAttr.g;
    this.geoAttributes.color.array[fieldId * 4 + 2] = this.defaultColorAttr.b;
    this.geoAttributes.color.array[fieldId * 4 + 3] = this.defaultColorAttr.a;
  }

  updateFields() {
    const { renderVelocities, renderForces, earthquakes, volcanicEruptions } = this.store;
    const fieldFound: Record<string, boolean> = {};
    this.plate.forEachField((field) => {
      fieldFound[field.id] = true;
      if (!this.visibleFields.has(field)) {
        this.visibleFields.add(field);
      }
      this.updateFieldAttributes(field);
      
      if (renderVelocities && field.id % VELOCITY_ARROWS_DIVIDER === 0) {
        const absolutePosWithElevation = field.absolutePos.clone().setLength(PLATE_RADIUS + getElevationInViewUnits(field.elevation));
        this.velocities.setVector(field.id / VELOCITY_ARROWS_DIVIDER, field.linearVelocity, absolutePosWithElevation);
      }
      if (renderForces) {
        const absolutePosWithElevation = field.absolutePos.clone().setLength(PLATE_RADIUS + getElevationInViewUnits(field.elevation));
        this.forces.setVector(field.id, field.force, absolutePosWithElevation);
      }
      if (earthquakes) {
        const visible = field.earthquakeMagnitude > 0;
        this.earthquakes.setProps(field.id, {
          visible,
          // Note that we still need to update position if earthquake is invisible, as there might be an ease-out transition in progress.
          position: field.absolutePos.clone().setLength(PLATE_RADIUS + getElevationInViewUnits(field.elevation) + EARTHQUAKES_LAYER_DIFF),
          color: visible ? depthToColor(field.earthquakeDepth) : null,
          size: visible ? magnitudeToSize(field.earthquakeMagnitude) : null
        });
      }
      if (volcanicEruptions) {
        this.volcanicEruptions.setProps(field.id, {
          visible: field.volcanicEruption,
          // Note that we still need to update position if eruption is invisible, as there might be an ease-out transition in progress.
          position: field.absolutePos.clone().setLength(PLATE_RADIUS + getElevationInViewUnits(field.elevation) + VOLCANIC_ERUPTIONS_LAYER_DIFF),
          size: field.volcanicEruption ? 0.016 : null
        });
      }
    });
    // Process fields that are still visible, but no longer part of the plate model.
    this.visibleFields.forEach((field: any) => {
      if (!fieldFound[field.id]) {
        this.visibleFields.delete(field);
        this.hideField(field.id);
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
