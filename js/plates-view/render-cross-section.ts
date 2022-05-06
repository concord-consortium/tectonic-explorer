import * as THREE from "three";
import config from "../config";
import { scaleLinear } from "d3-scale";
import { interpolateHcl } from "d3-interpolate";
import { depthToColor, drawEarthquakeShape } from "./earthquake-helpers";
import { drawVolcanicEruptionShape } from "./volcanic-eruption-helpers";
import {
  OCEANIC_CRUST_COLOR, CONTINENTAL_CRUST_COLOR, MANTLE_BRITTLE, MANTLE_DUCTILE, OCEAN_COLOR, SKY_COLOR_1, SKY_COLOR_2,
  MAGMA_SILICA_RICH, MAGMA_IRON_RICH, METAMORPHIC_LOW_GRADE, METAMORPHIC_MEDIUM_GRADE, METAMORPHIC_HIGH_GRADE, MAGMA_INTERMEDIATE,
  MAGMA_BLOB_BORDER, MAGMA_BLOB_BORDER_METAMORPHIC
} from "../colors/cross-section-colors";
import { getRockCanvasPattern } from "../colors/rock-colors";
import { IEarthquake, ICrossSectionFieldData, IMagmaBlobData, IRockLayerData, DIV_BOUNDARY_NORMALIZED_AGE } from "../plates-model/get-cross-section";
import { SEA_LEVEL } from "../plates-model/crust";
import { Rock, rockProps } from "../plates-model/rock-properties";
import { RockKeyLabel } from "../types";
import { getDivergentBoundaryMagmaAnimProgress, getDivergentBoundaryMagmaFrame  } from "./magma-frames-divergent-boundary";
import { getSubductionZoneMagmaFrame } from "./magma-frames-subduction-zone";

export interface ICrossSectionOptions {
  rockLayers: boolean;
  metamorphism: boolean;
}

export interface ICrossSectionPointViewData {
  dist: number;
  field: ICrossSectionFieldData | null;
}

export interface ICrossSectionPlateViewData {
  points: ICrossSectionPointViewData[];
}

export interface IMergedRockLayerData {
  rock: Rock;
  relativeThickness1: number;
  relativeThickness2: number;
  metamorphic?: number;
}

// At the moment, the only interactivity is related to rock sample tool. However, in the future, cross-section
// might define more areas that could be interactive.
export type InteractiveObjectLabel = RockKeyLabel;

export interface IIntersectionData {
  label: InteractiveObjectLabel;
  field?: ICrossSectionFieldData;
}

const CS_HEIGHT = 240; // px
const SKY_PADDING = 30; // px, area above the dynamic cross-section view, filled with sky gradient
const TOTAL_HEIGHT = CS_HEIGHT + SKY_PADDING;
const MAX_ELEVATION = 1;
const MIN_ELEVATION = config.crossSectionMinElevation;

const MAGMA_BLOB_BORDER_WIDTH_METAMORPHIC = 5;
const MAGMA_BLOB_BORDER_WIDTH = 1;

// Magma blob will become light red after traveling X distance vertically.
export const LIGHT_RED_MAGMA_DIST = 2.4;

const METAMORPHISM_OROGENY_COLOR_STEP_0 = Number(config.metamorphismOrogenyColorSteps[0]);
const METAMORPHISM_OROGENY_COLOR_STEP_1 = Number(config.metamorphismOrogenyColorSteps[1]);
const METAMORPHISM_OROGENY_COLOR_STEP_2 = Number(config.metamorphismOrogenyColorSteps[2]);
const METAMORPHISM_SUBDUCTION_COLOR_STEP_0 = Number(config.metamorphismSubductionColorSteps[0]);
const METAMORPHISM_SUBDUCTION_COLOR_STEP_1 = Number(config.metamorphismSubductionColorSteps[1]);


// See: https://docs.google.com/presentation/d/1ogyESzguVme2SUq4d-RTxTAqGCndQcSecUMh899oD-0/edit#slide=id.g11a9dd4c6e8_0_16
const divergentBoundaryNewFieldDividerColor = scaleLinear<number, string>()
  .domain([0.2, 0.7])
  .range(["red", "black"] as any)
  .interpolate(interpolateHcl as any);

export function scaleX(xModel: number) {
  return Math.floor(xModel * config.crossSectionPxPerKm);
}

export function scaleY(yModel: number) {
  return SKY_PADDING + Math.floor(CS_HEIGHT * (1 - (yModel - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION)));
}

// Inverted scaleY function that lets us convert from view coordinates to model coordinates.
export function invScaleY(yView: number) {
  return (1 - (yView - SKY_PADDING) / CS_HEIGHT) * (MAX_ELEVATION - MIN_ELEVATION) + MIN_ELEVATION;

}

function earthquakeColor(depth: number) {
  // convert to hex color
  return "#" + depthToColor(depth).toString(16).padStart(6, "0");
}

const magmaColor = scaleLinear<string>()
  .domain([0, 1])
  .range([MAGMA_IRON_RICH, MAGMA_INTERMEDIATE, MAGMA_SILICA_RICH]);

export function crossSectionWidth(data: ICrossSectionPlateViewData[]) {
  let maxDist = 0;
  data.forEach((plateData: ICrossSectionPlateViewData) => {
    const lastPoint = plateData.points[plateData.points.length - 1];
    if (lastPoint && lastPoint.dist > maxDist) {
      maxDist = lastPoint.dist;
    }
  });
  return scaleX(maxDist);
}

export function shouldMergeRockLayers(layers1: IRockLayerData[], layers2: IRockLayerData[]) {
  // Both layer arrays have the same bottom layer (e.g. granite or gabbro).
  return layers1[layers1.length - 1].rock === layers2[layers2.length - 1].rock;
}

export function mergeRockLayers(layers1: IRockLayerData[], layers2: IRockLayerData[]) {
  const result: IMergedRockLayerData[] = [];
  let i = 0;
  let j = 0;
  while (i < layers1.length || j < layers2.length) {
    const a = layers1[i];
    const b = layers2[j];

    if (a !== undefined && (b === undefined || rockProps(a.rock).orderIndex < rockProps(b.rock).orderIndex)) {
      result.push({ rock: a.rock, relativeThickness1: a.relativeThickness, relativeThickness2: 0, metamorphic: a.metamorphic });
      i += 1;
    } else if (b !== undefined && (a === undefined || rockProps(b.rock).orderIndex < rockProps(a.rock).orderIndex)) {
      result.push({ rock: b.rock, relativeThickness1: 0, relativeThickness2: b.relativeThickness, metamorphic: b.metamorphic });
      j += 1;
    } else if (rockProps(a.rock).orderIndex === rockProps(b.rock).orderIndex) {
      result.push({ rock: a.rock, relativeThickness1: a.relativeThickness, relativeThickness2: b.relativeThickness, metamorphic: a.metamorphic });
      i += 1;
      j += 1;
    }
  }
  return result;
}

export default function renderCrossSection(canvas: HTMLCanvasElement, data: ICrossSectionPlateViewData[], options: ICrossSectionOptions, testPoint?: THREE.Vector2) {
  (new CrossSectionRenderer(canvas, data, options, testPoint)).render();
}

export function getIntersectionWithTestPoint(canvas: HTMLCanvasElement, data: ICrossSectionPlateViewData[], options: ICrossSectionOptions, testPoint: THREE.Vector2): IIntersectionData | null {
  return (new CrossSectionRenderer(canvas, data, options, testPoint)).getIntersection();
}

class CrossSectionRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  data: ICrossSectionPlateViewData[];
  options: ICrossSectionOptions;
  testPoint?: THREE.Vector2;
  intersection: IIntersectionData | null = null;

  constructor(canvas: HTMLCanvasElement, data: ICrossSectionPlateViewData[], options: ICrossSectionOptions, testPoint?: THREE.Vector2) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
      throw new Error("2D context not available");
    }
    this.ctx = ctx;
    this.data = data;
    this.options = options;
    this.testPoint = testPoint;
  }

  getIntersection() {
    if (!this.testPoint) {
      throw Error("testPoint is not set");
    }
    this.render();
    return this.intersection;
  }

  render() {
    // Ensure that canvas has at least 1px width, so it can be used as a texture in 3D view.
    this.width = Math.max(1, crossSectionWidth(this.data));
    this.height = TOTAL_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderSkyAndSea();
    this.data.forEach((plateData: ICrossSectionPlateViewData) => this.renderPlate(plateData));
    // Second pass of rendering that will be drawn on top of existing plates. E.g. in some cases z-index of
    // some object should be independent of z-index of its plate (earthquakes, volcanic eruptions).
    this.data.forEach((plateData: ICrossSectionPlateViewData) => this.renderPlateOverlay(plateData));
  }

  renderSkyAndSea() {
    // Sky.
    const seaLevelScaled = scaleY(SEA_LEVEL); // 0.5 is a sea level in model units
    const sky = this.ctx.createLinearGradient(0, 0, 0, seaLevelScaled);
    sky.addColorStop(0, SKY_COLOR_1);
    sky.addColorStop(1, SKY_COLOR_2);
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.width, seaLevelScaled);
    if (this.testPoint && this.testPoint.y < seaLevelScaled) {
      this.intersection = { label: "Sky" };
    }
    // Ocean.
    this.ctx.fillStyle = OCEAN_COLOR;
    this.ctx.fillRect(0, seaLevelScaled, this.width, CS_HEIGHT);
    if (this.testPoint && this.testPoint.y >= seaLevelScaled) {
      this.intersection = { label: "Ocean" };
    }
  }

  renderPlate(plateData: ICrossSectionPlateViewData) {
    const subductionZoneMagmaPoints: THREE.Vector2[] = [];

    const firstPoint = plateData.points[0];
    const lastPoint = plateData.points[plateData.points.length - 1];
    for (let i = 0; i < plateData.points.length - 1; i += 1) {
      const x1 = plateData.points[i].dist;
      const x2 = plateData.points[i + 1].dist;
      const f1 = plateData.points[i].field;
      const f2 = plateData.points[i + 1].field;
      if (!f1 || !f2) {
        continue;
      }

      let leftBlockFaulting = false;
      let rightBlockFaulting = false;
      if (config.blockFaultingStrength && f1.blockFaulting && f2.blockFaulting) {
        leftBlockFaulting = f1.blockFaulting < f2.blockFaulting;
        rightBlockFaulting = f1.blockFaulting > f2.blockFaulting;
      }
      // Top of the crust
      // Block faulting moves one of the fields slightly up to create a sharp edge / block corner.
      const t1 = new THREE.Vector2(x1, f1.elevation + (leftBlockFaulting ? config.blockFaultingStrength : 0));
      const t2 = new THREE.Vector2(x2, f2.elevation + (rightBlockFaulting ? config.blockFaultingStrength : 0));
      const tMid = new THREE.Vector2((t1.x + t2.x) / 2, (t1.y + t2.y) / 2);
      // Bottom of the crust, top of the lithosphere
      const c1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness);
      const c2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness);
      const cMid = new THREE.Vector2((c1.x + c2.x) / 2, (c1.y + c2.y) / 2);
      // Bottom of the lithosphere, top of the mantle
      const l1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness - f1.lithosphereThickness);
      const l2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness - f2.lithosphereThickness);
      const lMid = new THREE.Vector2((l1.x + l2.x) / 2, (l1.y + l2.y) / 2);
      // Bottom of the cross section and mantle
      const b1 = new THREE.Vector2(x1, config.subductionMinElevation);
      const b2 = new THREE.Vector2(x2, config.subductionMinElevation);

      if (f1.marked) {
        this.drawMarker(t1);
      }
      // Fill crust
      if (!this.options.rockLayers) {
        this.renderBasicCrust(f1, t1, tMid, cMid, c1);
        this.renderBasicCrust(f2, tMid, t2, c2, cMid);
      } else {
        // Rock layers should be merged when we're rendering the same crust type - oceanic or continental.
        // When crust types are different, just make a sharp boundary.
        if (shouldMergeRockLayers(f1.rockLayers, f2.rockLayers)) {
          this.renderMergedRockLayers(mergeRockLayers(f1.rockLayers, f2.rockLayers), f1, t1, t2, c2, c1);
        } else {
          this.renderSeparateRockLayers(f1, t1, tMid, cMid, c1);
          this.renderSeparateRockLayers(f2, tMid, t2, c2, cMid);
        }
      }
      // New crust around divergent boundary is highlighted for a while.
      const divergentBoundaryPosition = firstPoint.field?.normalizedAge === DIV_BOUNDARY_NORMALIZED_AGE
        ? "left"
        : (lastPoint.field?.normalizedAge === DIV_BOUNDARY_NORMALIZED_AGE ? "right" : undefined);

      this.renderFreshCrustOverlay(f1, t1, tMid, cMid, c1, divergentBoundaryPosition);
      this.renderFreshCrustOverlay(f2, tMid, t2, c2, cMid, divergentBoundaryPosition);

      if (this.options.rockLayers && this.options.metamorphism) {
        this.renderMetamorphicOverlay(f1, t1, tMid, cMid, c1);
        this.renderMetamorphicOverlay(f2, tMid, t2, c2, cMid);
      }

      // Fill lithosphere
      if (this.fillPath(MANTLE_BRITTLE, c1, c2, l2, l1)) {
        this.intersection = { label: "Mantle (brittle)", field: f1 };
      }
      // Fill mantle
      if (this.fillPath(MANTLE_DUCTILE, l1, l2, b2, b1)) {
        this.intersection = { label: "Mantle (ductile)", field: f2 };
      }
      // Debug info, optional
      if (config.debugCrossSection) {
        this.debugInfo(l1, b1, [i, f1.normalizedAge?.toFixed(2) ?? 0, f2.normalizedAge?.toFixed(2) ?? 0]);
      }
      if (f1.magma && f1.magma.length > 0) {
        this.drawMagma(f1.magma, f1, l1);
        subductionZoneMagmaPoints.push(l1);
      }
      if (f1.divergentBoundaryMagma) {
        this.drawDivergentBoundaryMagma(f1, t1, tMid, lMid, l1);
      }
      if (f2.divergentBoundaryMagma) {
        this.drawDivergentBoundaryMagma(f2, t2, tMid, lMid, l2);
      }
      // Add contour lines to block faulting.
      if (leftBlockFaulting) {
        this.fillPath2([t1, t2], undefined, "black");
        this.fillPath2([t2, t1.clone().lerp(c1, config.blockFaultingDepth)], undefined, "black");
      }
      if (rightBlockFaulting) {
        this.fillPath2([t1, t2], undefined, "black");
        this.fillPath2([t1, t2.clone().lerp(c2, config.blockFaultingDepth)], undefined, "black");
      }
    }
    this.drawSubductionZoneMagma(subductionZoneMagmaPoints);
  }

  renderPlateOverlay(plateData: ICrossSectionPlateViewData) {
    for (let i = 0; i < plateData.points.length - 1; i += 1) {
      const x = plateData.points[i].dist;
      const f = plateData.points[i].field;
      if (f?.earthquake) {
        this.drawEarthquake(x, f.earthquake);
      }
      if (f?.volcanicEruption) {
        this.drawVolcanicEruption(x, f.elevation);
      }
    }
  }

  fillPath(color: string | CanvasGradient | CanvasPattern, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
    ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
    ctx.lineTo(scaleX(p3.x), scaleY(p3.y));
    ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
    ctx.closePath();
    ctx.fill();
    if (this.testPoint) {
      return ctx.isPointInPath(this.testPoint.x, this.testPoint.y);
    }
  }

  fillPath2(points: THREE.Vector2[], fill?: string | CanvasGradient | CanvasPattern, stroke?: string, lineWidth?: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) {
        ctx.moveTo(scaleX(p.x), scaleY(p.y));
      } else {
        ctx.lineTo(scaleX(p.x), scaleY(p.y));
      }
    });
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
    if (this.testPoint) {
      return ctx.isPointInPath(this.testPoint.x, this.testPoint.y);
    }
  }

  checkStroke(points: THREE.Vector2[], lineWidth: number) {
    const ctx = this.ctx;
    if (!ctx.isPointInStroke) {
      // Environment doesn't support isPointInStroke. Fortunately, it's only IE and Node.js Canvas implementation
      // used by Jest tests.
      return false;
    }
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) {
        ctx.moveTo(scaleX(p.x), scaleY(p.y));
      } else {
        ctx.lineTo(scaleX(p.x), scaleY(p.y));
      }
    });
    ctx.closePath();
    ctx.lineWidth = lineWidth;
    if (this.testPoint) {
      return ctx.isPointInStroke(this.testPoint.x, this.testPoint.y);
    }
  }

  renderSeparateRockLayers(field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    const ctx = this.ctx;
    let currentThickness = 0;
    field.rockLayers.forEach(rl => {
      const p1tmp = p1.clone().lerp(p4, currentThickness);
      const p2tmp = p2.clone().lerp(p3, currentThickness);
      const p3tmp = p2.clone().lerp(p3, currentThickness + rl.relativeThickness);
      const p4tmp = p1.clone().lerp(p4, currentThickness + rl.relativeThickness);
      if (this.fillPath(getRockCanvasPattern(ctx, rl.rock), p1tmp, p2tmp, p3tmp, p4tmp)) {
        this.intersection = { label: rockProps(rl.rock).label, field };
      }
      if (rl.metamorphic && rl.metamorphic > 0) {
        // For now, the only rock layer that can be metamorphic is ocean sediment that creates an accretionary wedge.
        // It should be marked as Low Grade Metamorphic Rock (Subduction Zone).
        // See: https://www.pivotaltracker.com/story/show/181127137/comments/231009389
        this.fillMetamorphicOverlay("Low Grade Metamorphic Rock (Subduction Zone)", field, p1tmp, p2tmp, p3tmp, p4tmp);
      }
      currentThickness += rl.relativeThickness;
    });
  }

  renderMergedRockLayers(mergedRockLayers: IMergedRockLayerData[], field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    let currentThickness1 = 0;
    let currentThickness2 = 0;
    mergedRockLayers.forEach(rl => {
      const p1tmp = p1.clone().lerp(p4, currentThickness1);
      const p2tmp = p2.clone().lerp(p3, currentThickness2);
      const p3tmp = p2.clone().lerp(p3, currentThickness2 + rl.relativeThickness2);
      const p4tmp = p1.clone().lerp(p4, currentThickness1 + rl.relativeThickness1);
      if (this.fillPath(getRockCanvasPattern(this.ctx, rl.rock), p1tmp, p2tmp, p3tmp, p4tmp)) {
        this.intersection = { label: rockProps(rl.rock).label, field };
      }
      if (rl.metamorphic && rl.metamorphic > 0) {
        // For now, the only rock layer that can be metamorphic is ocean sediment that creates an accretionary wedge.
        // It should be marked as Low Grade Metamorphic Rock (Subduction Zone).
        // See: https://www.pivotaltracker.com/story/show/181127137/comments/231009389
        this.fillMetamorphicOverlay("Low Grade Metamorphic Rock (Subduction Zone)", field, p1tmp, p2tmp, p3tmp, p4tmp);
      }
      currentThickness1 += rl.relativeThickness1;
      currentThickness2 += rl.relativeThickness2;
    });
  }

  renderBasicCrust(field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    this.fillPath(field.canSubduct ? OCEANIC_CRUST_COLOR : CONTINENTAL_CRUST_COLOR, p1, p2, p3, p4);
  }

  renderFreshCrustOverlay(field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2, divergentBoundaryPosition?: "left" | "right") {
    const normalizedAge = field?.normalizedAge || 1;
    if (normalizedAge < 1) {
      this.fillPath(`rgba(255, 255, 255, ${1 - Math.pow(normalizedAge, 0.5)})`, p1, p2, p3, p4);

      if (divergentBoundaryPosition) {
        const color = divergentBoundaryNewFieldDividerColor(normalizedAge);
        const renderHorizontalLine = (heightRatio: number) => {
          const kSpikeWidth = 0.25; // 25% of the field width
          const a = p1.clone().lerp(p4, heightRatio);
          const b = p2.clone().lerp(p3, heightRatio);
          const start = divergentBoundaryPosition === "left" ? b : a;
          const maxEnd = divergentBoundaryPosition === "left" ? a : b;
          const end = start.clone().lerp(maxEnd, kSpikeWidth);
          this.fillPath2([start, end], undefined, color, 1);
        };
        this.fillPath2([p2, p3], undefined, color, 1);
        renderHorizontalLine(0.2); renderHorizontalLine(0.4); renderHorizontalLine(0.6); renderHorizontalLine(0.8);
      }
    }
  }

  fillMetamorphicOverlay(interactiveObjectLabel: InteractiveObjectLabel, field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    let color = METAMORPHIC_LOW_GRADE;
    if (interactiveObjectLabel.startsWith("Medium Grade Metamorphic Rock")) {
      color = METAMORPHIC_MEDIUM_GRADE;
    } else if (interactiveObjectLabel.startsWith("High Grade Metamorphic Rock")) {
      color = METAMORPHIC_HIGH_GRADE;
    }
    // Metamorphic color overlay.
    this.fillPath(color, p1, p2, p3, p4);
    // Metamorphic pattern overlay.
    if (this.fillPath(getRockCanvasPattern(this.ctx, "metamorphic"), p1, p2, p3, p4)) {
      this.intersection = { label: interactiveObjectLabel, field };
    }
  }

  renderMetamorphicOverlay(field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    if (field.canSubduct && field.subduction) {
      // "Horizontal" metamorphism.
      let possibleInteractiveObjectLabel: InteractiveObjectLabel;
      if (field.subduction < METAMORPHISM_SUBDUCTION_COLOR_STEP_0) {
        possibleInteractiveObjectLabel = "Low Grade Metamorphic Rock (Subduction Zone)";
      } else if (field.subduction < METAMORPHISM_SUBDUCTION_COLOR_STEP_1) {
        possibleInteractiveObjectLabel = "Medium Grade Metamorphic Rock (Subduction Zone)";
      } else {
        possibleInteractiveObjectLabel = "High Grade Metamorphic Rock (Subduction Zone)";
      }
      this.fillMetamorphicOverlay(possibleInteractiveObjectLabel, field, p1, p2, p3, p4);
    } else {
      const metamorphic = field?.metamorphic || 0;
      if (metamorphic > 0) {
        // "Vertical" metamorphism.
        if (field.subduction && !field.canSubduct) {
          // points that are subducting, but shouldn't, will skip the first metamorphic color (transparent).
          // They're deeper, so the visualization looks better when we start from the second shade to match
          // neighboring points better.
          // Divide vertical p1-p4 line into 3 sections (p1-p1a, p1a-p1b, p1b-p4).
          const p1a = (new THREE.Vector2()).lerpVectors(p1, p4, METAMORPHISM_OROGENY_COLOR_STEP_0);
          const p1b = (new THREE.Vector2()).lerpVectors(p1, p4, METAMORPHISM_OROGENY_COLOR_STEP_1);
          // Divide vertical p2-p3 line into 3 sections (p2-p2a, p2a-p2b, p2b-p3).
          const p2a = (new THREE.Vector2()).lerpVectors(p2, p3, METAMORPHISM_OROGENY_COLOR_STEP_0);
          const p2b = (new THREE.Vector2()).lerpVectors(p2, p3, METAMORPHISM_OROGENY_COLOR_STEP_1);

          this.fillMetamorphicOverlay("Low Grade Metamorphic Rock (Continental Collision)", field, p1, p2, p2a, p1a);
          this.fillMetamorphicOverlay("Medium Grade Metamorphic Rock (Continental Collision)", field, p1a, p2a, p2b, p1b);
          this.fillMetamorphicOverlay("High Grade Metamorphic Rock (Continental Collision)", field, p1b, p2b, p3, p4);
        } else {
          // Divide vertical p1-p4 line into 4 sections (p1-p1a, p1a-p1b, p1b-p1c, p1c-p4).
          const p1a = (new THREE.Vector2()).lerpVectors(p1, p4, METAMORPHISM_OROGENY_COLOR_STEP_0);
          const p1b = (new THREE.Vector2()).lerpVectors(p1, p4, METAMORPHISM_OROGENY_COLOR_STEP_1);
          const p1c = (new THREE.Vector2()).lerpVectors(p1, p4, METAMORPHISM_OROGENY_COLOR_STEP_2);
          // Divide vertical p2-p3 line into 4 sections (p2-p2a, p2a-p2b, p2b-p2c, p2c-p3).
          const p2a = (new THREE.Vector2()).lerpVectors(p2, p3, METAMORPHISM_OROGENY_COLOR_STEP_0);
          const p2b = (new THREE.Vector2()).lerpVectors(p2, p3, METAMORPHISM_OROGENY_COLOR_STEP_1);
          const p2c = (new THREE.Vector2()).lerpVectors(p2, p3, METAMORPHISM_OROGENY_COLOR_STEP_2);

          this.fillMetamorphicOverlay("Low Grade Metamorphic Rock (Continental Collision)", field, p1a, p2a, p2b, p1b);
          this.fillMetamorphicOverlay("Medium Grade Metamorphic Rock (Continental Collision)", field, p1b, p2b, p2c, p1c);
          this.fillMetamorphicOverlay("High Grade Metamorphic Rock (Continental Collision)", field, p1c, p2c, p3, p4);
        }
      }
    }
  }

  drawMagma(magma: IMagmaBlobData[], field: ICrossSectionFieldData, bottom: THREE.Vector2) {
    const { rockLayers, metamorphism } = this.options;
    const kx = 40;
    const ky = 0.08;
    const borderColor = rockLayers && metamorphism ? MAGMA_BLOB_BORDER_METAMORPHIC : MAGMA_BLOB_BORDER;
    const borderWidth = rockLayers && metamorphism ? MAGMA_BLOB_BORDER_WIDTH_METAMORPHIC : MAGMA_BLOB_BORDER_WIDTH;
    magma.forEach(blob => {
      if (blob.dist < 0.1) {
        // Don't render magma blobs immediately, as they might be rendered below the subduction zone magma.
        return;
      }
      const p1 = bottom.clone();
      p1.x += blob.xOffset;
      p1.y = bottom.y + blob.dist;
      const p2 = p1.clone();
      p2.x += kx;
      p2.y += -0.75 * ky;

      const p3 = p2.clone();
      p3.x += 0.5 * kx;
      p3.y += -ky;

      const p4 = p3.clone();
      p4.x += -1.5 * kx;
      p4.y += -3 * ky;
      const p5 = p4.clone();
      p5.x += -1.5 * kx;
      p5.y += 3 * ky;

      const p6 = p5.clone();
      p6.x += 0.5 * kx;
      p6.y += ky;

      const verticalProgress = blob.dist / LIGHT_RED_MAGMA_DIST; // [0, 1]
      const transformedIntoRock = rockLayers && !blob.active && !blob.isErupting && blob.finalRockType;
      let color: string | CanvasPattern = magmaColor(verticalProgress);
      // && blob.finalRockType is redundant, but otherwise TS complains about this value being potentially undefined
      if (transformedIntoRock && blob.finalRockType) {
        color = getRockCanvasPattern(this.ctx, blob.finalRockType);
      }

      if (this.fillPath2([p1, p2, p3, p4, p5, p6], color, borderColor, borderWidth)) {
        if (transformedIntoRock && blob.finalRockType) {
          this.intersection = { label: rockProps(blob.finalRockType).label, field };
        } else if (verticalProgress < 0.33) { // actual color uses linear interpolation, so this is the simplest division into discrete values
          this.intersection = { label: "Iron-rich Magma", field };
        } else if (verticalProgress < 0.66) {
          this.intersection = { label: "Intermediate Magma", field };
        } else {
          this.intersection = { label: "Iron-poor Magma", field };
        }
      }
      if (this.checkStroke([p1, p2, p3, p4, p5, p6], borderWidth)) {
        this.intersection = { label: "Contact Metamorphism", field };
      }
    });
  }

  drawDivergentBoundaryMagma(field: ICrossSectionFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
    const ctx = this.ctx;

    // Draw radiating pattern around magma image.
    const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
    const animationProgress = getDivergentBoundaryMagmaAnimProgress();
    // Radiating pattern animates 3x as fast as the magma itself. There's some ease-out function used too.
    const radiatingPatternProgress = easeOut((3 * animationProgress) % 1);
    const radiatingPatternWidth = (0.2 + 0.8 * radiatingPatternProgress) * (p2.x - p1.x);
    ctx.fillStyle = `rgba(255, 0, 0, ${1 - 0.5 * radiatingPatternProgress})`;
    ctx.beginPath();
    ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
    ctx.lineTo(scaleX(p1.x + radiatingPatternWidth), scaleY(p2.y));
    ctx.lineTo(scaleX(p1.x + radiatingPatternWidth), scaleY(p3.y));
    ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
    ctx.fill();

    // Draw magma image / frame.
    const frame = getDivergentBoundaryMagmaFrame();
    if (!frame.complete) {
      // Skip animation rendering if frames are still loading.
      return;
    }
    const nativeWidth = 67;
    const nativeHeight = 164;
    const scale = 0.45;

    ctx.drawImage(frame, scaleX(p1.x) - 0.5 * scale * nativeWidth, scaleY(p1.y) - 3, scale * nativeWidth, scale * nativeHeight);

    if (this.testPoint && ctx.isPointInPath(this.testPoint.x, this.testPoint.y)) {
      this.intersection = { label: "Iron-rich Magma", field };
    }
  }

  drawSubductionZoneMagma(points: THREE.Vector2[]) {
    if (points.length === 0) {
      return;
    }
    const avgLocation = points.reduce((p, avg) => avg.add(p), new THREE.Vector2()).divideScalar(points.length);

    const ctx = this.ctx;

    // Draw magma image / frame.
    const frame = getSubductionZoneMagmaFrame();
    if (!frame.complete) {
      // Skip animation rendering if frames are still loading.
      return;
    }
    const nativeWidth = 190;
    const nativeHeight = 78;
    const scale = 0.7;

    ctx.drawImage(frame,
      scaleX(avgLocation.x) - 0.5 * scale * nativeWidth, scaleY(avgLocation.y) - 0.55 * scale * nativeHeight,
      scale * nativeWidth, scale * nativeHeight
    );

    if (this.testPoint && ctx.isPointInPath(this.testPoint.x, this.testPoint.y)) {
      this.intersection = { label: "Iron-rich Magma" };
    }
  }

  drawMarker(crustPos: THREE.Vector2) {
    const ctx = this.ctx;
    ctx.fillStyle = "#af3627";
    const markerWidth = 4;
    const markerHeight = 22;
    const x = scaleX(crustPos.x);
    const topY = scaleY(crustPos.y) - markerHeight;
    ctx.fillRect(x - markerWidth / 2, topY, markerWidth, markerHeight);
    ctx.beginPath();
    ctx.arc(x, topY, markerWidth * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEarthquake(xPos: number, earthquake: IEarthquake) {
    const earthquakeSize = (4 + Math.ceil(earthquake.magnitude * 1.5));
    const x = scaleX(xPos);
    const y = scaleY(earthquake.depth);
    drawEarthquakeShape(this.ctx, x, y, earthquakeSize, earthquakeColor(earthquake.depth));
  }

  drawVolcanicEruption(xPos: number, elevation: number) {
    const x = scaleX(xPos);
    const y = scaleY(elevation);
    drawVolcanicEruptionShape(this.ctx, x, y, 16);
  }

  debugInfo(p1: THREE.Vector2, p2: THREE.Vector2, info: (string | number)[]) {
    const ctx = this.ctx;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
    ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
    ctx.stroke();
    ctx.fillStyle = "black";
    info.forEach((text: any, idx: any) => {
      ctx.fillText(text, scaleX(p1.x) + 5, scaleY(p1.y) + 10 + 10 * idx);
    });
  }
}
