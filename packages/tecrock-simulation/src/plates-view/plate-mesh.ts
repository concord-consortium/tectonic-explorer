import * as THREE from "three";
import vertexShader from "./plate-mesh-vertex.glsl";
import fragmentShader from "./plate-mesh-fragment.glsl";
import VectorField from "./vector-field";
import ForceArrow from "./force-arrow";
import TemporalEvents from "./temporal-events";
import { earthquakeTexture, depthToColor, magnitudeToSize } from "./earthquake-helpers";
import { volcanicEruptionTexture } from "./volcanic-eruption-helpers";
import PlateLabel from "./plate-label";
import { crustAgeColor, hueAndElevationToRgb, MAX_ELEVATION, MIN_ELEVATION, normalizeElevation, preexistingCrustAgeColor, topoColor } from "../colors/topographic-colors";
import { cssColorToHexNumber, cssColorToRGBAFloat, hueToColor, RGBAFloat } from "../colors/utils";
import config, { Colormap } from "../config";
import getGrid from "../plates-model/grid";
import { autorun, observe, reaction } from "mobx";
import { SimulationStore } from "../stores/simulation-store";
import PlateStore from "../stores/plate-store";
import FieldStore from "../stores/field-store";
import { Rock } from "../plates-model/rock-properties";
import { getRockPatternImgSrc } from "../colors/rock-colors";
import { MAX_NORMALIZED_AGE } from "../plates-model/field";
import mountainsImg from "../data/mountains.jpg";

const MIN_SPEED_TO_RENDER_POLE = 0.002;
// Render every nth velocity arrow (performance).
const VELOCITY_ARROWS_DIVIDER = 3;
const BOUNDARY_COLOR = { r: 0.8, g: 0.2, b: 0.5, a: 1 };
const HIGHLIGHT_COLOR = { r: 0.38, g: 0.86, b: 0.04, a: 1 };
const PREEXISTING_CRUST_COLOR = cssColorToRGBAFloat(preexistingCrustAgeColor);
// Special color value that indicates that colormap texture should be used.
const USE_COLORMAP_COLOR = { r: 0, g: 0, b: 0, a: 0 };
// Larger value will make mountains in the 3D view more pronounced.
export const ELEVATION_SCALE = 0.06;
// Colormap elevation range.
const ELEVATION_RANGE = MAX_ELEVATION - MIN_ELEVATION;
// PLATE_RADIUS reflects radius of the geodesic mesh in view units. This value should not be changed unless
// geodesic grid is updated too.
export const PLATE_RADIUS = 1;

// Constants below define order of rendering (like z-index):
const LAYER_DIFF = 0.004;
const EARTHQUAKES_LAYER_DIFF = 1 * LAYER_DIFF;
const VOLCANIC_ERUPTIONS_LAYER_DIFF = 2 * LAYER_DIFF;

const SHARED_BUMP_MAP = new THREE.TextureLoader().load(mountainsImg);
SHARED_BUMP_MAP.colorSpace = THREE.NoColorSpace;

// If there's a new rock type added, it needs to be included in the map below and the plate-mesh-fragment.glsl file
// needs to be updated too:
// 1. Two arrays that define patterns and scale need a new length. For example:
//    uniform sampler2D patterns[11]; -> uniform sampler2D patterns[12];
//    uniform float patternScale[11]; -> uniform float patternScale[12];
// 2. Extend switch statement that resolves the pattern sampler and scale value:
//    case 11: diffuseColor *= texture2D(patterns[11], vUv * patternScale[11]); break;
//    Note that it's the only way to do it in GLSL. It's impossible to simply say:
//    texture2D(patterns[vPatternIdx], vUv * patternScale[vPatternIdx]);
//    GLSL returns an error saying that "array index for samplers must be constant integral expressions".
const ROCK_PATTERN_MAP: Record<Rock, THREE.Texture> = {
  [Rock.OceanicSediment]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.OceanicSediment)),
  [Rock.Granite]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Granite)),
  [Rock.Basalt]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Basalt)),
  [Rock.Gabbro]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Gabbro)),
  [Rock.Rhyolite]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Rhyolite)),
  [Rock.Andesite]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Andesite)),
  [Rock.Diorite]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Diorite)),
  [Rock.ContinentalSediment]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.ContinentalSediment)),
  [Rock.Limestone]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Limestone)),
  [Rock.Shale]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Shale)),
  [Rock.Sandstone]: new THREE.TextureLoader().load(getRockPatternImgSrc(Rock.Sandstone))
};

// Each rock pattern image has different size. This param will adjust the texture scaling.
// Values are obtained by manual testing and checking what looks good and matches the rock key.
const ROCK_PATTERN_SCALE: Record<Rock, number> = {
  [Rock.OceanicSediment]: 30,
  [Rock.Granite]: 1, // never visible on surface
  [Rock.Basalt]: 150,
  [Rock.Gabbro]: 1, // never visible on surface
  [Rock.Rhyolite]: 30,
  [Rock.Andesite]: 120,
  [Rock.Diorite]: 1,  // never visible on surface
  [Rock.ContinentalSediment]: 30,
  [Rock.Limestone]: 70,
  [Rock.Shale]: 150,
  [Rock.Sandstone]: 20,
};

const ROCK_PATTERN_IDX: Partial<Record<Rock, number>> = {};
const ROCK_PATTERNS_ARRAY: THREE.Texture[] = [];
const ROCK_PATTERNS_SCALE_ARRAY: number[] = [];

Object.keys(ROCK_PATTERN_MAP).forEach((key, idx) => {
  const rock = key as unknown as Rock;
  const texture = ROCK_PATTERN_MAP[rock];
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.flipY = false; // don't flip Y while uploading to GPU, so patterns match the rock key images
  ROCK_PATTERN_IDX[rock] = idx;
  ROCK_PATTERNS_ARRAY.push(texture);
  ROCK_PATTERNS_SCALE_ARRAY.push(ROCK_PATTERN_SCALE[rock]);
});

export function getElevationInViewUnits(elevation: number) {
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
    transparent: true,
    specular: 0x000000,
    shininess: 0,
    alphaTest: 0.1,
    flatShading: config.flatShading,
  });
  material.uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
  // Colormap texture that maps colormapValue attribute ([0, 1]) to a color using 1px x <width>px texture.
  // UV coordinates are not used. Used for the topographic coloring where normalized elevation is mapped to colors.
  material.uniforms.colormap = { value: null };
  material.uniforms.usePatterns = { value: false };
  // Array of textures that use regular UV coordinates to get a color for given pixel.
  // colormapValue attribute is used to chose a particular texture. Used for rock patterns.
  material.uniforms.patterns = { value: ROCK_PATTERNS_ARRAY };
  material.uniforms.patternScale = { value: ROCK_PATTERNS_SCALE_ARRAY };

  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  if (config.bumpMapping) {
    material.bumpMap = SHARED_BUMP_MAP;
  }
  return material;
}

function getColormapTexture(numberOfShades: number, colorFunction: (value: number) => string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  const height = numberOfShades;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2d context not available");
  }
  for (let i = 0; i < height; i += 1) {
    const normalizedValue = i / height;
    ctx.fillStyle = colorFunction(normalizedValue);
    ctx.fillRect(0, height - 1 - i, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (numberOfShades < 200) {
    // If number of shades is relatively small, use NearestFilter as it'll ensure that colors are not interpolated
    // and the transitions are visible. It's useful to create an effect that resembles a real topographic map.
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function axisOfRotation(color: number) {
  const geometry = new THREE.CylinderGeometry(0.01, 0.01, 2.2);
  const material = new THREE.MeshPhongMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

export default class PlateMesh {
  axis: THREE.Mesh;
  earthquakes: any;
  forceArrow: any;
  forces: any;
  helpersColor: number; // hex
  label: any;
  observerDispose: any;
  plateId: any;
  root: any;
  store: SimulationStore;
  velocities: any;
  visibleFields: Set<FieldStore>;
  volcanicEruptions: any;

  basicMesh: THREE.Mesh<THREE.BufferGeometry>;
  geometry: THREE.BufferGeometry;
  material: THREE.RawShaderMaterial;
  colormapTextures: Partial<Record<Colormap, THREE.Texture>> = {};
  defaultColorAttr: RGBAFloat;
  defaultColormapValue: number;
  defaultPatternIdx: number;

  constructor(plateId: number, store: SimulationStore) {
    this.plateId = plateId;
    this.store = store;

    this.material = getMaterial();
    this.basicMesh = this.basicPlateMesh();

    // Colormap texture is a preferable way of coloring plate mesh, but it will not work in all the cases.
    // Check #fieldColor and #updateVisibleFieldAttributes methods for more details.
    this.colormapTextures.topo = getColormapTexture(config.topoColormapShades,
      // value will be in [0, 1] range, convert it colormap elevation range.
      (value: number) => colToHex(topoColor(value * ELEVATION_RANGE + MIN_ELEVATION))
    );
    this.colormapTextures.plate = getColormapTexture(config.topoColormapShades,
      // value will be in [0, 1] range, convert it colormap elevation range.
      (value: number) => colToHex(hueAndElevationToRgb(this.plate.hue, value * ELEVATION_RANGE + MIN_ELEVATION))
    );
    this.colormapTextures.age = getColormapTexture(config.topoColormapShades,
      (value: number) => colToHex(crustAgeColor(value * MAX_NORMALIZED_AGE))
    );

    this.visibleFields = new Set();

    this.root = new THREE.Object3D();
    this.root.add(this.basicMesh);

    // Color used by various arrows and shapes related to plate (e.g. Euler pole or force arrow).
    this.helpersColor = cssColorToHexNumber(hueToColor(this.plate.hue, 1.0));

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

    this.observeStore(store);

    this.setColormap(store.colormap, store.sediments);
  }

  get geoAttributes() {
    return this.basicMesh.geometry.attributes as { [name: string]: THREE.BufferAttribute };
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
      this.velocities.visible = store.plateVelocityVisible;
      this.forces.visible = store.renderForces;
      this.earthquakes.visible = store.earthquakes;
      this.volcanicEruptions.visible = store.volcanicEruptions;
      this.forceArrow.visible = store.renderHotSpots;
      this.label.visible = store.renderPlateLabels;
      this.axis.visible = store.renderEulerPoles;
      this.updatePlateAndFields();
    }));
    // Why `reaction` instead of `autorun`? `autorun` would catch many of the observable store properties being used
    // in the #updateFields() call. So, it'd trigger the callback too often. `reaction` provides more fine grained control.
    this.observerDispose.push(reaction(() => ({
      colormap: store.colormap,
      sediments: store.sediments
    }), (values) => {
      this.setColormap(values.colormap, values.sediments);
      this.updateFields();
    }));
    // Most of the PlateStore properties and none of the FieldStore properties are observable (due to performance reasons).
    // The only observable property is #dataUpdateID which gets incremented each time a new data from model worker is
    // received. If that happens, we need to update all views based on PlateStore and FieldStore properties.
    this.observerDispose.push(observe(this.plate, "dataUpdateID", () => {
      this.updatePlateAndFields();
    }));
  }

  dispose() {
    Object.values(this.colormapTextures).forEach(texture => texture?.dispose());
    this.material.dispose();
    this.geometry.dispose();
    this.axis.geometry.dispose();
    (this.axis.material as THREE.Material).dispose();
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
    this.geometry.setAttribute("elevation", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("hidden", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("colormapValue", new THREE.BufferAttribute(new Float32Array(verticesCount), 1));
    this.geometry.setAttribute("patternIdx", new THREE.Int32BufferAttribute(new Int32Array(verticesCount), 1));
    (this.geometry.attributes.color as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.attributes.vertexBumpScale as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.attributes.elevation as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.attributes.hidden as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.attributes.colormapValue as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.attributes.patternIdx as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    // Hide all fields by default. Later updates will set correct value for visible fields.
    for (let i = 0; i < verticesCount; i += 1) {
      this.geometry.attributes.hidden.setX(i, 1);
    }

    this.geometry.computeBoundingSphere();

    return new THREE.Mesh(this.geometry, this.material);
  }

  setColormap(colormap: Colormap, sediments: boolean) {
    if (colormap === "topo") {
      this.material.uniforms.usePatterns.value = false;
      this.material.uniforms.colormap.value = this.colormapTextures.topo;
      // Fields at the divergent boundary should have 0 elevation.
      this.defaultColormapValue = normalizeElevation(0);
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };
    } else if (colormap === "plate") {
      this.material.uniforms.usePatterns.value = false;
      // Note that for most fields colormap texture will be used. However, in some specific cases color attribute
      // can be used too. See #fieldColor method too.
      this.material.uniforms.colormap.value = this.colormapTextures.plate;
      // Fields at the divergent boundary should have 0 elevation.
      this.defaultColormapValue = normalizeElevation(0);
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };
    } else if (colormap === "age") {
      this.material.uniforms.usePatterns.value = false;
      this.material.uniforms.colormap.value = this.colormapTextures.age;
      // Fields at the divergent boundary should have max age to avoid strange color transition around preexisting
      // crust borders.
      this.defaultColormapValue = 1;
      this.defaultColorAttr = PREEXISTING_CRUST_COLOR;
    } else if (colormap === "rock") {
      this.material.uniforms.usePatterns.value = true;
      this.material.uniforms.colormap.value = null;
      // Fields at the divergent boundary should be made of Oceanic Sediment when sediments are visible
      // or Basalt when they're not.
      this.defaultPatternIdx = (sediments ? ROCK_PATTERN_IDX[Rock.OceanicSediment] : ROCK_PATTERN_IDX[Rock.Basalt]) || 0;
      this.defaultColorAttr = { r: 0, g: 0, b: 0, a: 0 };

      // If we're using vertex coloring, it'd be:
      // this.material.uniforms.colormap.value = null;
      // this.defaultColormapValue = 0;
      // // Fields at the divergent boundary should be made of basalt.
      // this.defaultColorAttr = getRockColorRGBAFloat(Rock.Basalt);
    }

    // Default colors have been reset, calling hideField for each field will update these values.
    const fieldsCount = this.verticesCount;
    for (let i = 0; i < fieldsCount; i += 1) {
      this.hideField(i);
    }
  }

  updatePlateAndFields() {
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
      this.forceArrow.update({
        force: hotSpot.force,
        position: hotSpot.position
      });
    }
    this.label.update(this.plate);
    this.updateFields();
  }

  fieldColor(field: FieldStore) {
    if (field.highlighted) {
      return HIGHLIGHT_COLOR;
    }
    if (this.store.renderBoundaries && field.boundary) {
      return BOUNDARY_COLOR;
    }
    if (this.store.colormap === "age" && field.normalizedAge === MAX_NORMALIZED_AGE) {
      // Note that this is special case for preexisting crust. Field color attribute will be used instead of
      // regular crust age colormap (it's only applied to "fresh" crust)
      return PREEXISTING_CRUST_COLOR;
    }
    // If crust age colormap should not be used, this would be an option. It avoid some strange color transitions,
    // but provides more blurry and less precise rendering.
    // if (this.store.colormap === "age") {
    // return crustAgeColor(field.normalizedAge);
    // }
    // If rock patterns were not used:
    // if (this.store.colormap === "rock") {
    //   return getRockColorRGBAFloat(field.rockType);
    // }
    // Age coloring could be be done either by color attribute or a colormap texture.
    // Texture provides a bit sharper rendering. Otherwise, we could also use:
    // if (this.store.colormap === "age") {
    //   return hueAndElevationToRgb(this.plate.hue, 1 - field.normalizedAge);
    // }

    // Other colormaps use texture as values can be nicely interpolated in fragment shader (e.g. topo colormap).
    return USE_COLORMAP_COLOR;
  }

  updateVisibleFieldAttributes(field: FieldStore) {
    const id = field.id;
    this.geoAttributes.hidden.setX(id, 0);

    // There are two ways to color each field (represented by a single vertex). It's either a color attribute
    // or a colormap texture. Whenever it's possible, it's better to use colormap texture. We can send to GPU this
    // texture and colormap value per each vertex. This value will be nicely interpolated for each pixel (pixels between
    // three vertices in a mesh triangle). Then, the colormap value is read in fragment shader using this interpolated
    // value. It provides very nice interpolation. This approach works only when colormap is continuous. A good
    // example is a topographic colormap. In this case, colormap values would be normalized elevation that can be
    // interpolated nicely. However, it won't work when colors are discrete and we cannot interpolate between them.
    // A good example is rock types or very specific coloring like plate boundary. This requires color attribute per
    // each vertex. GPU will interpolate final pixel colors between triangle vertices what creates a bit blurry edges.
    const color = this.fieldColor(field);
    const linearRGBColor = (new THREE.Color()).setRGB(color.r, color.g, color.b, THREE.SRGBColorSpace);
    this.geoAttributes.color.setXYZW(id, linearRGBColor.r, linearRGBColor.g, linearRGBColor.b, color.a);

    if (color === USE_COLORMAP_COLOR) {
      const colormap = this.store.colormap;
      if (colormap === "topo" || colormap === "plate") {
        this.geoAttributes.colormapValue.setX(id, normalizeElevation(field.elevation));
      } else if (colormap === "age") {
        // Note that crust colormap is also handled in fieldColor() method. Preexisting crust will use a color attribute
        // and this colormap will be ignored (color !== USE_COLORMAP_COLOR).
        // Also, field.normalizedAge is no longer normalized / within [0, 1] range. See its comments.
        this.geoAttributes.colormapValue.setX(id, field.normalizedAge / MAX_NORMALIZED_AGE);
      } else if (colormap === "rock") {
        // colormapValue will be used to pick the texture in plate-mesh-fragment.glsl.
        this.geoAttributes.patternIdx.setX(id, ROCK_PATTERN_IDX[field.rockType] || 0);
      }
    }

    // Elevation will modify mesh geometry.
    // When flat shading is used, we don't care about vertex normals.
    // Otherwise, update position attribute, as that's the only way to get correct normals later.
    if (config.flatShading) {
      this.geoAttributes.elevation.setX(id, getElevationInViewUnits(field.elevation));
    } else {
      const posWithElevation = field.localPos.clone().setLength(PLATE_RADIUS + getElevationInViewUnits(field.elevation));
      this.geoAttributes.position.setXYZ(id, posWithElevation.x, posWithElevation.y, posWithElevation.z);
    }

    // This equation defines bump mapping of the terrain. Makes mountains look a bit more realistic.
    let bump = field.elevation && Math.max(0.0025, Math.pow(Math.max(0, field.elevation - 0.57), 1.3));
    if (field.normalizedAge < 1) {
      // Make oceanic ridges bumpy too.
      bump += (1 - field.normalizedAge) * 0.07;
    }
    bump = Math.min(1, bump);
    bump *= 500; // necessary after upgrade to ThreeJS v160
    this.geoAttributes.vertexBumpScale.setX(id, bump);
  }

  hideField(fieldId: number) {
    this.geoAttributes.hidden.setX(fieldId, 1);
    // It's important to reset elevation too. Hidden fields are actually used as a borders of visible fields.
    // If elevation is set to non-zero value, it can create strange effects (steep slope at the plate edge).
    if (config.flatShading) {
      this.geoAttributes.elevation.setX(fieldId, 0);
    } else {
      const basicPos = getGrid().fields[fieldId].localPos;
      this.geoAttributes.position.setXYZ(fieldId, basicPos.x, basicPos.y, basicPos.z);
    }
    // The same thing applies to colors. Hidden field color will affect border of the visible plate part.
    // Default colormap value should match color that is expected around mid ocean ridge where new fields are
    // added and connected to hidden fields. This color will be visible at the very edge of plate.
    // Reset colormap value attribute after colormap is updated for each fields.
    this.geoAttributes.colormapValue.setX(fieldId, this.defaultColormapValue);
    this.geoAttributes.patternIdx.setX(fieldId, this.defaultPatternIdx);
    this.geoAttributes.vertexBumpScale.setX(fieldId, 0);

    this.geoAttributes.color.setXYZW(
      fieldId,
      this.defaultColorAttr.r, this.defaultColorAttr.g, this.defaultColorAttr.b, this.defaultColorAttr.a
    );
  }

  updateFields() {
    const { plateVelocityVisible, renderForces, earthquakes, volcanicEruptions } = this.store;
    const fieldFound: Record<string, boolean> = {};
    this.plate.forEachField((field) => {
      fieldFound[field.id] = true;
      if (!this.visibleFields.has(field)) {
        this.visibleFields.add(field);
      }
      this.updateVisibleFieldAttributes(field);

      if (plateVelocityVisible && field.id % VELOCITY_ARROWS_DIVIDER === 0) {
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
          size: 0.016
        });
      }
    });
    // Process fields that are still visible, but no longer part of the plate model.
    this.visibleFields.forEach((field: any) => {
      if (!fieldFound[field.id]) {
        this.visibleFields.delete(field);
        this.hideField(field.id);
        if (plateVelocityVisible && field.id % VELOCITY_ARROWS_DIVIDER === 0) {
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

    // THREE.JS requires needsUpdate flag to be updated to true.
    // Everything that has been updated in this method, or its child methods, should have the flag updated.
    // Most of attributes are updated in #updateVisibleFieldAttributes.
    this.geoAttributes.hidden.needsUpdate = true;
    this.geoAttributes.color.needsUpdate = true;
    this.geoAttributes.colormapValue.needsUpdate = true;
    this.geoAttributes.patternIdx.needsUpdate = true;
    this.geoAttributes.vertexBumpScale.needsUpdate = true;
    // Flat shading doesn't require normals. And it uses faster way to calculate final elevation.
    if (config.flatShading) {
      this.geoAttributes.elevation.needsUpdate = true;
    } else {
      this.geoAttributes.position.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }
  }

  updateTransitions(progress: any) {
    this.earthquakes.updateTransitions(progress);
    this.volcanicEruptions.updateTransitions(progress);
  }
}
