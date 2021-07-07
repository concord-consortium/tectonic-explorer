import * as THREE from "three";
import config from "../config";
import { scaleLinear } from "d3-scale";
import { depthToColor, drawEarthquakeShape } from "./earthquake-helpers";
import { drawVolcanicEruptionShape } from "./volcanic-eruption-helpers";
import { 
  OCEANIC_CRUST_COLOR, CONTINENTAL_CRUST_COLOR, LITHOSPHERE_COLOR, MANTLE_COLOR, OCEAN_COLOR, SKY_COLOR_1, SKY_COLOR_2, 
  MAGMA_LIGHT_RED, MAGMA_DARK_RED, METAMORPHIC_0, METAMORPHIC_1, METAMORPHIC_2, METAMORPHIC_3, MAGMA_INTERMEDIATE, MAGMA_BLOB_BORDER 
} from "../colors/cross-section-colors";
import { getRockCanvasPattern, getRockColor } from "../colors/rock-colors";
import { IChunkArray, IEarthquake, IFieldData, IMagmaBlobData, IRockLayerData } from "../plates-model/get-cross-section";
import { SEA_LEVEL } from "../plates-model/field";
import { UPDATE_INTERVAL } from "../plates-model/model-output";
import { Rock, rockProps } from "../plates-model/rock-properties";

export interface ICrossSectionOptions {
  rockLayers: boolean;
}

interface IMergedRockLayerData {
  rock: Rock;
  relativeThickness1: number;
  relativeThickness2: number;
}

const HEIGHT = 240; // px
const SKY_PADDING = 30; // px, area above the dynamic cross-section view, filled with sky gradient
const MAX_ELEVATION = 1;
const MIN_ELEVATION = config.crossSectionMinElevation;

const MAGMA_BLOB_BORDER_WIDTH = 3;

const LAVA_THICKNESS = 0.05; // km

// Magma blob will become light red after traveling X distance vertically.
const LIGHT_RED_MAGMA_DIST = 1.2;

const METAMORPHISM_OROGENY_COLOR_STEP_0 = Number(config.metamorphismOrogenyColorSteps[0]);
const METAMORPHISM_OROGENY_COLOR_STEP_0_END = METAMORPHISM_OROGENY_COLOR_STEP_0 + 0.01;
const METAMORPHISM_OROGENY_COLOR_STEP_1 = Number(config.metamorphismOrogenyColorSteps[1]);
const METAMORPHISM_OROGENY_COLOR_STEP_1_END = METAMORPHISM_OROGENY_COLOR_STEP_1 + 0.01;
const METAMORPHISM_OROGENY_COLOR_STEP_2 = Number(config.metamorphismOrogenyColorSteps[2]);
const METAMORPHISM_OROGENY_COLOR_STEP_2_END = METAMORPHISM_OROGENY_COLOR_STEP_2 + 0.01;
const METAMORPHISM_SUBDUCTION_COLOR_STEP_0 = Number(config.metamorphismSubductionColorSteps[0]);
const METAMORPHISM_SUBDUCTION_COLOR_STEP_1 = Number(config.metamorphismSubductionColorSteps[1]);

function scaleX(x: number) {
  return Math.floor(x * config.crossSectionPxPerKm);
}

function scaleY(y: number) {
  return SKY_PADDING + Math.floor(HEIGHT * (1 - (y - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION)));
}

function scaleHeight(height: number) {
  return Math.floor(HEIGHT * height / (MAX_ELEVATION - MIN_ELEVATION));
}

function earthquakeColor(depth: number) {
  // convert to hex color
  return "#" + depthToColor(depth).toString(16).padStart(6, "0");
}

const SEA_LEVEL_SCALED = scaleY(SEA_LEVEL); // 0.5 is a sea level in model units

const METAMORPHOSIS_GRADIENT_HEIGHT = scaleHeight(2);

function crossSectionWidth(data: IChunkArray[]) {
  let maxDist = 0;
  data.forEach((chunkData: IChunkArray) => {
    const lastPoint = chunkData.chunks[chunkData.chunks.length - 1];
    if (lastPoint && lastPoint.dist > maxDist) {
      maxDist = lastPoint.dist;
    }
  });
  return scaleX(maxDist);
}

function fillPath(ctx: CanvasRenderingContext2D, color: string | CanvasGradient | CanvasPattern, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
  ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
  ctx.lineTo(scaleX(p3.x), scaleY(p3.y));
  ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
  ctx.closePath();
  ctx.fill();
}

function fillPath2(ctx: CanvasRenderingContext2D, points: THREE.Vector2[], fill?: string, stroke?: string, lineWidth?: number) {
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
}

const magmaColor = scaleLinear<string>()
  .domain([0, 1])
  .range([MAGMA_DARK_RED, MAGMA_INTERMEDIATE, MAGMA_LIGHT_RED]);

function drawMagma(ctx: CanvasRenderingContext2D, magma: IMagmaBlobData[], top: THREE.Vector2, bottom: THREE.Vector2) {
  const kx = 40;
  const ky = 0.08;
  magma.forEach(blob => {
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

    let color = magmaColor(blob.dist / LIGHT_RED_MAGMA_DIST);
    if (!blob.active && blob.finalRockType) {
      color = getRockColor(blob.finalRockType);
    }

    fillPath2(ctx, [p1, p2, p3, p4, p5, p6], color, MAGMA_BLOB_BORDER, MAGMA_BLOB_BORDER_WIDTH);
  });
}

// Very simple approach to "animation". Divergent boundary magma will be clipped. Animation progress is defined
// by number of draw calls. It only a small visual hint and it doesn't have to correlated with the real model.
let magmaAnimationFrame = 0;
// The more often cross-section is updated, the more steps the full animation cycle has to have.
const animationStepsCount = 600 / UPDATE_INTERVAL.crossSection;

function drawDivergentBoundaryMagma(ctx: CanvasRenderingContext2D, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  // Draw a little triangle on top of the regular field. It represents flowing lava.
  const t1 = p1.clone();
  t1.y += LAVA_THICKNESS;

  const t2 =  t1.clone().lerp(p2, 1.0);
  const t3 = p1.clone().lerp(p2, 0.3);
  const t4 = t3.clone();
  t4.y = p4.y + (p1.y - p4.y) * 0.7;
  const t5 = p2.clone().lerp(p3, 0.3);

  const t1XScaled = scaleX(t1.x);
  const t1YScaled = scaleY(t1.y);
  const p3XScaled = scaleX(p3.x);
  const p3YScaled = scaleY(p3.y);
  
  const clipRectHeight = Math.abs(p3YScaled - t1YScaled);
  const clipRectWidth = Math.abs(p3XScaled - t1XScaled);
  let animationStep = magmaAnimationFrame % animationStepsCount;
  if (animationStep > 0.5 * animationStepsCount) {
    animationStep = animationStepsCount - animationStep;
  }
  const animationProgress = Math.pow(animationStep / (animationStepsCount * 0.5), 0.5);
  
  ctx.save();

  ctx.beginPath();
  ctx.rect(Math.min(t1XScaled, p3XScaled), t1YScaled + (1 - animationProgress) * clipRectHeight, clipRectWidth, animationProgress * clipRectHeight);
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, t1YScaled, 0, p3YScaled);
  gradient.addColorStop(0, MAGMA_LIGHT_RED);
  gradient.addColorStop(1, MAGMA_DARK_RED);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(t1XScaled, t1YScaled);
  ctx.lineTo(scaleX(t2.x), scaleY(t2.y));
  ctx.lineTo(scaleX(t3.x), scaleY(t3.y));
  ctx.lineTo(scaleX(t4.x), scaleY(t4.y));
  ctx.lineTo(scaleX(t5.x), scaleY(t5.y));
  ctx.lineTo(p3XScaled, p3YScaled);
  ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  magmaAnimationFrame += 1;
}

function drawMarker(ctx: CanvasRenderingContext2D, crustPos: THREE.Vector2) {
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

function drawEarthquake(ctx: CanvasRenderingContext2D, xPos: number, earthquake: IEarthquake) {
  const earthquakeSize = (4 + Math.ceil(earthquake.magnitude * 1.5));
  const x = scaleX(xPos);
  const y = scaleY(earthquake.depth);
  drawEarthquakeShape(ctx, x, y, earthquakeSize, earthquakeColor(earthquake.depth));
}

function drawVolcanicEruption(ctx: CanvasRenderingContext2D, xPos: number, elevation: number) {
  const x = scaleX(xPos);
  const y = scaleY(elevation);
  drawVolcanicEruptionShape(ctx, x, y, 16);
}

function debugInfo(ctx: CanvasRenderingContext2D, p1: THREE.Vector2, p2: THREE.Vector2, info: (string | number)[]) {
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

function renderSeparateRockLayers(ctx: CanvasRenderingContext2D, field: IFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  let currentThickness = 0;
  field.rockLayers.forEach(rl => {
    const p1tmp = p1.clone().lerp(p4, currentThickness);
    const p2tmp = p2.clone().lerp(p3, currentThickness);
    const p3tmp = p2.clone().lerp(p3, currentThickness + rl.relativeThickness);
    const p4tmp = p1.clone().lerp(p4, currentThickness + rl.relativeThickness);
    fillPath(ctx, config.crossSectionPatterns ? getRockCanvasPattern(ctx, rl.rock) : getRockColor(rl.rock), p1tmp, p2tmp, p3tmp, p4tmp);
    currentThickness += rl.relativeThickness;
  });
}

function renderBasicCrust(ctx: CanvasRenderingContext2D, field: IFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  fillPath(ctx, field.canSubduct ? OCEANIC_CRUST_COLOR : CONTINENTAL_CRUST_COLOR, p1, p2, p3, p4);
}

function renderFreshCrustOverlay(ctx: CanvasRenderingContext2D, field: IFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  const normalizedAge = field?.normalizedAge || 1;
  if (normalizedAge < 1) {
    fillPath(ctx, `rgba(255, 255, 255, ${1 - Math.pow(normalizedAge, 0.2)})`, p1, p2, p3, p4);
  }
}

function renderMetamorphicOverlay(ctx: CanvasRenderingContext2D, field: IFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  let color;
  if (field.canSubduct && field.subduction) {
    if (field.subduction < METAMORPHISM_SUBDUCTION_COLOR_STEP_0) {
      color = METAMORPHIC_1;
    } else if (field.subduction < METAMORPHISM_SUBDUCTION_COLOR_STEP_1) {
      color = METAMORPHIC_2;
    } else {
      color = METAMORPHIC_3;
    }
  } else {
    const metamorphic = field?.metamorphic || 0;
    if (metamorphic > 0) {
      const angle = new THREE.Vector2(scaleX(p2.x) - scaleX(p1.x), scaleY(p2.y) - scaleY(p1.y)).angle();
      const angleCos = Math.cos(angle);
      const diff = new THREE.Vector2(0, METAMORPHOSIS_GRADIENT_HEIGHT);
      diff.rotateAround(new THREE.Vector2(0, 0), angle);
      color = ctx.createLinearGradient(scaleX(p1.x), scaleY(p1.y), scaleX(p1.x) + diff.x, scaleY(p1.y) + diff.y);
      if (field.subduction && !field.canSubduct) {
        // Fields that are subducting, but shouldn't, will skip the first metamorphic color (transparent).
        // They're deeper, so the visualization looks better when we start from the second shade to match 
        // neighboring fields better.
        color.addColorStop(0, METAMORPHIC_1);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_0 * angleCos)), METAMORPHIC_1);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_0_END * angleCos)), METAMORPHIC_2);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_1 * angleCos)), METAMORPHIC_2);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_1_END * angleCos)), METAMORPHIC_3);
        color.addColorStop(Math.max(0, Math.min(1, angleCos)), METAMORPHIC_3);
      } else {
        color.addColorStop(0, METAMORPHIC_0);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_0 * angleCos)), METAMORPHIC_0);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_0_END * angleCos)), METAMORPHIC_1);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_1 * angleCos)), METAMORPHIC_1);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_1_END * angleCos)), METAMORPHIC_2);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_2 * angleCos)), METAMORPHIC_2);
        color.addColorStop(Math.max(0, Math.min(1, METAMORPHISM_OROGENY_COLOR_STEP_2_END * angleCos)), METAMORPHIC_3);
        color.addColorStop(Math.max(0, Math.min(1, angleCos)), METAMORPHIC_3);
      }
    }
  }
  if (color) {
    fillPath(ctx, color, p1, p2, p3, p4);
  }
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
      result.push({ rock: a.rock, relativeThickness1: a.relativeThickness, relativeThickness2: 0 });
      i += 1;
    } else if (b !== undefined && (a === undefined || rockProps(b.rock).orderIndex < rockProps(a.rock).orderIndex)) {
      result.push({ rock: b.rock, relativeThickness1: 0, relativeThickness2: b.relativeThickness });
      j += 1;
    } else if (rockProps(a.rock).orderIndex === rockProps(b.rock).orderIndex) {
      result.push({ rock: a.rock, relativeThickness1: a.relativeThickness, relativeThickness2: b.relativeThickness });
      i += 1;
      j += 1;
    }
  }
  return result;
}

function renderMergedRockLayers(ctx: CanvasRenderingContext2D, mergedRockLayers: IMergedRockLayerData[], p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  let currentThickness1 = 0;
  let currentThickness2 = 0;
  mergedRockLayers.forEach(rl => {
    const p1tmp = p1.clone().lerp(p4, currentThickness1);
    const p2tmp = p2.clone().lerp(p3, currentThickness2);
    const p3tmp = p2.clone().lerp(p3, currentThickness2 + rl.relativeThickness2);
    const p4tmp = p1.clone().lerp(p4, currentThickness1 + rl.relativeThickness1);
    fillPath(ctx, config.crossSectionPatterns ? getRockCanvasPattern(ctx, rl.rock) : getRockColor(rl.rock), p1tmp, p2tmp, p3tmp, p4tmp);
    currentThickness1 += rl.relativeThickness1;
    currentThickness2 += rl.relativeThickness2;
  });
}

function renderChunk(ctx: CanvasRenderingContext2D, chunkData: IChunkArray, options: ICrossSectionOptions) {
  for (let i = 0; i < chunkData.chunks.length - 1; i += 1) {
    const x1 = chunkData.chunks[i].dist;
    const x2 = chunkData.chunks[i + 1].dist;
    const f1 = chunkData.chunks[i].field;
    const f2 = chunkData.chunks[i + 1].field;
    if (!f1 || !f2) {
      continue;
    }
    // Top of the crust
    const t1 = new THREE.Vector2(x1, f1.elevation);
    const t2 = new THREE.Vector2(x2, f2.elevation);
    const tMid = new THREE.Vector2((t1.x + t2.x) / 2, (t1.y + t2.y) / 2);
    // Bottom of the crust, top of the lithosphere
    const c1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness);
    const c2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness);
    const cMid = new THREE.Vector2((c1.x + c2.x) / 2, (c1.y + c2.y) / 2);
    // Bottom of the lithosphere, top of the mantle
    const l1 = new THREE.Vector2(x1, f1.elevation - f1.crustThickness - f1.lithosphereThickness);
    const l2 = new THREE.Vector2(x2, f2.elevation - f2.crustThickness - f2.lithosphereThickness);
    // Bottom of the cross section and mantle
    const b1 = new THREE.Vector2(x1, config.subductionMinElevation);
    const b2 = new THREE.Vector2(x2, config.subductionMinElevation);

    if (f1.marked) {
      drawMarker(ctx, t1);
    }
    // Fill crust
    if (!options.rockLayers) {
      renderBasicCrust(ctx, f1, t1, tMid, cMid, c1);
      renderBasicCrust(ctx, f2, tMid, t2, c2, cMid);
    } else {
      // Rock layers should be merged when we're rendering the same crust type - oceanic or continental.
      // When crust types are different, just make a sharp boundary.
      if (shouldMergeRockLayers(f1.rockLayers, f2.rockLayers)) {
        renderMergedRockLayers(ctx, mergeRockLayers(f1.rockLayers, f2.rockLayers), t1, t2, c2, c1);
      } else {
        renderSeparateRockLayers(ctx, f1, t1, tMid, cMid, c1);
        renderSeparateRockLayers(ctx, f2, tMid, t2, c2, cMid);
      }
    }
    // New crust around divergent boundary is highlighted for a while.
    renderFreshCrustOverlay(ctx, f1, t1, tMid, cMid, c1);
    renderFreshCrustOverlay(ctx, f2, tMid, t2, c2, cMid);

    renderMetamorphicOverlay(ctx, f1, t1, tMid, cMid, c1);
    renderMetamorphicOverlay(ctx, f2, tMid, t2, c2, cMid);

    // Fill lithosphere
    fillPath(ctx, LITHOSPHERE_COLOR, c1, c2, l2, l1);
    // Fill mantle
    fillPath(ctx, MANTLE_COLOR, l1, l2, b2, b1);
    // Debug info, optional
    if (config.debugCrossSection) {
      debugInfo(ctx, l1, b1, [i, f1.id, x1.toFixed(1) + " km"]);
    }
    if (f1.magma) {
      drawMagma(ctx, f1.magma, t1, c1);
    }
    if (f1.divergentBoundaryMagma) {
      drawDivergentBoundaryMagma(ctx, t1, tMid, cMid, c1);
    }
    if (f2.divergentBoundaryMagma) {
      drawDivergentBoundaryMagma(ctx, t2, tMid, cMid, c2);
    }
  }
}

function renderChunkOverlay(ctx: CanvasRenderingContext2D, chunkData: IChunkArray) {
  for (let i = 0; i < chunkData.chunks.length - 1; i += 1) {
    const x = chunkData.chunks[i].dist;
    const f = chunkData.chunks[i].field;
    if (f?.earthquake) {
      drawEarthquake(ctx, x, f.earthquake);
    }
    if (f?.volcanicEruption) {
      drawVolcanicEruption(ctx, x, f.elevation);
    }
  }
}

function renderSkyAndSea(ctx: CanvasRenderingContext2D, width: number) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, SEA_LEVEL_SCALED);
  sky.addColorStop(0, SKY_COLOR_1);
  sky.addColorStop(1, SKY_COLOR_2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, SEA_LEVEL_SCALED);
  // Ocean.
  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, SEA_LEVEL_SCALED, width, HEIGHT);
}

export default function renderCrossSection(canvas: HTMLCanvasElement, data: IChunkArray[], options: ICrossSectionOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  // Ensure that canvas has at least 1px width, so it can be used as a texture in 3D view.
  const width = Math.max(1, crossSectionWidth(data));
  canvas.width = width;
  canvas.height = HEIGHT + SKY_PADDING;
  ctx.clearRect(0, 0, width, HEIGHT + SKY_PADDING);
  renderSkyAndSea(ctx, width);
  data.forEach((chunkData: IChunkArray) => renderChunk(ctx, chunkData, options));
  // Second pass of rendering that will be drawn on top of existing plates. E.g. in some cases z-index of
  // some object should be independent of z-index of its plate (earthquakes, volcanic eruptions).
  data.forEach((chunkData: IChunkArray) => renderChunkOverlay(ctx, chunkData));
}
