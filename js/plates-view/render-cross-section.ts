import * as THREE from "three";
import config from "../config";
import magmaSrc from "../../images/magma.png";
import { depthToColor, drawEarthquakeShape } from "./earthquake-helpers";
import { drawVolcanicEruptionShape } from "./volcanic-eruption-helpers";
import { OCEANIC_CRUST_COL, CONTINENTAL_CRUST_COL, LITHOSPHERE_COL, MANTLE_COL, OCEAN_COL, SKY_COL_1, SKY_COL_2 }
  from "../cross-section-colors";
import { IChunkArray, IEarthquake, IFieldData } from "../plates-model/get-cross-section";
import { SEA_LEVEL } from "../plates-model/field";
import { rockColor } from "../colormaps";

export interface ICrossSectionOptions {
  rockLayers: boolean;
}

const HEIGHT = 240; // px
const SKY_PADDING = 30; // px, area above the dynamic cross-section view, filled with sky gradient
const MAX_ELEVATION = 1;
const MIN_ELEVATION = config.crossSectionMinElevation;

function scaleX(x: number) {
  return Math.floor(x * config.crossSectionPxPerKm);
}

function scaleY(y: number) {
  return SKY_PADDING + Math.floor(HEIGHT * (1 - (y - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION)));
}

function earthquakeColor(depth: number) {
  // convert to hex color
  return "#" + depthToColor(depth).toString(16).padStart(6, "0");
}

const SEA_LEVEL_SCALED = scaleY(SEA_LEVEL); // 0.5 is a sea level in model units

const magmaImg = (function() {
  const img = new window.Image();
  img.src = magmaSrc;
  return img;
})();

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

function fillPath(ctx: CanvasRenderingContext2D, color: string, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
  ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
  ctx.lineTo(scaleX(p3.x), scaleY(p3.y));
  ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
  ctx.closePath();
  ctx.fill();
}

function drawMagma(ctx: CanvasRenderingContext2D, top: THREE.Vector2) {
  ctx.drawImage(magmaImg, scaleX(top.x) - magmaImg.width / 2, scaleY(top.y));
}

function drawDivergentBoundaryMagma(ctx: CanvasRenderingContext2D, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2) {
  const tmp1 =  p1.clone().lerp(p2, 0.3);
  const tmp2 = tmp1.clone();
  tmp2.y = p4.y + (p1.y - p4.y) * 0.7;
  const tmp3 = p2.clone().lerp(p3, 0.3);
  
  const gradient = ctx.createLinearGradient(scaleX(p1.x), scaleY(p1.y), scaleX(p4.x), scaleY(p4.y));
  gradient.addColorStop(0, "#fc3c11");
  gradient.addColorStop(1, "#6b0009");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
  ctx.lineTo(scaleX(tmp1.x), scaleY(tmp1.y));
  ctx.lineTo(scaleX(tmp2.x), scaleY(tmp2.y));
  ctx.lineTo(scaleX(tmp3.x), scaleY(tmp3.y));
  ctx.lineTo(scaleX(p3.x), scaleY(p3.y));
  ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
  ctx.closePath();
  ctx.fill();
  
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

function renderCrust(ctx: CanvasRenderingContext2D, field: IFieldData, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2, options: ICrossSectionOptions) {
  if (options.rockLayers) {
    let currentThickness = 0;
    field.rockLayers.forEach(rl => {
      const p1tmp = p1.clone().lerp(p4, currentThickness);
      const p2tmp = p2.clone().lerp(p3, currentThickness);
      const p3tmp = p2.clone().lerp(p3, currentThickness + rl.relativeThickness);
      const p4tmp = p1.clone().lerp(p4, currentThickness + rl.relativeThickness);
      fillPath(ctx, rockColor(rl.rock), p1tmp, p2tmp, p3tmp, p4tmp);
      currentThickness += rl.relativeThickness;
    });
  } else {
    fillPath(ctx, field.oceanicCrust ? OCEANIC_CRUST_COL : CONTINENTAL_CRUST_COL, p1, p2, p3, p4);
  }
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
    renderCrust(ctx, f1, t1, tMid, cMid, c1, options);
    renderCrust(ctx, f2, tMid, t2, c2, cMid, options);
    // Fill lithosphere
    fillPath(ctx, LITHOSPHERE_COL, c1, c2, l2, l1);
    // Fill mantle
    fillPath(ctx, MANTLE_COL, l1, l2, b2, b1);
    // Debug info, optional
    if (config.debugCrossSection) {
      debugInfo(ctx, l1, b1, [i, f1.id, x1.toFixed(1) + " km"]);
    }
    if (f1.risingMagma) {
      drawMagma(ctx, t1);
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
  sky.addColorStop(0, SKY_COL_1);
  sky.addColorStop(1, SKY_COL_2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, SEA_LEVEL_SCALED);
  // Ocean.
  ctx.fillStyle = OCEAN_COL;
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
