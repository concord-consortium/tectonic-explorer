import * as THREE from "three";
import config from "../config";
import magmaSrc from "../../images/magma.png";
import { depthToColor, drawEarthquakeShape } from "./earthquake-helpers";
import { drawVolcanicEruptionShape } from "./volcanic-eruption-helpers";
import { OCEANIC_CRUST_COL, CONTINENTAL_CRUST_COL, LITHOSPHERE_COL, MANTLE_COL, OCEAN_COL, SKY_COL_1, SKY_COL_2 }
  from "../cross-section-colors";

const HEIGHT = 160; // px
const SKY_PADDING = 30; // px, area above the dynamic cross-section view, filled with sky gradient
const MAX_ELEVATION = 1;
const MIN_ELEVATION = config.crossSectionMinElevation;

function scaleX (x) {
  return Math.floor(x * config.crossSectionPxPerKm);
}

function scaleY (y) {
  return SKY_PADDING + Math.floor(HEIGHT * (1 - (y - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION)));
}

function earthquakeColor (depth) {
  // convert to hex color
  return "#" + depthToColor(depth).toString(16).padStart(6, "0");
}

const SEA_LEVEL = scaleY(0.5); // 0.5 is a sea level in model units

const magmaImg = (function () {
  const img = new window.Image();
  img.src = magmaSrc;
  return img;
})();

function crossSectionWidth (data) {
  let maxDist = 0;
  data.forEach(chunkData => {
    const lastPoint = chunkData[chunkData.length - 1];
    if (lastPoint && lastPoint.dist > maxDist) {
      maxDist = lastPoint.dist;
    }
  });
  return scaleX(maxDist);
}

function fillPath (ctx, color, p1, p2, p3, p4) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
  ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
  ctx.lineTo(scaleX(p3.x), scaleY(p3.y));
  ctx.lineTo(scaleX(p4.x), scaleY(p4.y));
  ctx.closePath();
  ctx.fill();
}

function drawMagma (ctx, top) {
  ctx.drawImage(magmaImg, scaleX(top.x) - magmaImg.width / 2, scaleY(top.y));
}

function drawMarker (ctx, crustPos) {
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

function drawEarthquake (ctx, xPos, earthquake) {
  const earthquakeSize = (4 + Math.ceil(earthquake.magnitude * 1.5));
  const x = scaleX(xPos);
  const y = scaleY(earthquake.depth);
  drawEarthquakeShape(ctx, x, y, earthquakeSize, earthquakeColor(earthquake.depth));
}

function drawVolcanicEruption (ctx, xPos, elevation) {
  const x = scaleX(xPos);
  const y = scaleY(elevation);
  drawVolcanicEruptionShape(ctx, x, y, 16);
}

function debugInfo (ctx, p1, p2, info) {
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(scaleX(p1.x), scaleY(p1.y));
  ctx.lineTo(scaleX(p2.x), scaleY(p2.y));
  ctx.stroke();
  ctx.fillStyle = "black";
  info.forEach((text, idx) => {
    ctx.fillText(text, scaleX(p1.x) + 5, scaleY(p1.y) + 10 + 10 * idx);
  });
}

function renderChunk (ctx, chunkData) {
  for (let i = 0; i < chunkData.length - 1; i += 1) {
    const x1 = chunkData[i].dist;
    const x2 = chunkData[i + 1].dist;
    const f1 = chunkData[i].field;
    const f2 = chunkData[i + 1].field;
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
    fillPath(ctx, f1.oceanicCrust ? OCEANIC_CRUST_COL : CONTINENTAL_CRUST_COL, t1, tMid, cMid, c1);
    fillPath(ctx, f2.oceanicCrust ? OCEANIC_CRUST_COL : CONTINENTAL_CRUST_COL, tMid, t2, c2, cMid);
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
  }
}

function renderChunkOverlay (ctx, chunkData) {
  for (let i = 0; i < chunkData.length - 1; i += 1) {
    const x = chunkData[i].dist;
    const f = chunkData[i].field;
    if (f.earthquake) {
      drawEarthquake(ctx, x, f.earthquake);
    }
    if (f.volcanicEruption) {
      drawVolcanicEruption(ctx, x, f.elevation);
    }
  }
}

function renderSkyAndSea (ctx, width) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, SEA_LEVEL);
  sky.addColorStop(0, SKY_COL_1);
  sky.addColorStop(1, SKY_COL_2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, SEA_LEVEL);
  // Ocean.
  ctx.fillStyle = OCEAN_COL;
  ctx.fillRect(0, SEA_LEVEL, width, HEIGHT);
}

export default function renderCrossSection (canvas, data) {
  const ctx = canvas.getContext("2d");
  // Ensure that canvas has at least 1px width, so it can be used as a texture in 3D view.
  const width = Math.max(1, crossSectionWidth(data));
  canvas.width = width;
  canvas.height = HEIGHT + SKY_PADDING;
  ctx.clearRect(0, 0, width, HEIGHT + SKY_PADDING);
  renderSkyAndSea(ctx, width);
  data.forEach(chunkData => renderChunk(ctx, chunkData));
  // Second pass of rendering that will be drawn on top of existing plates. E.g. in some cases z-index of
  // some object should be independent of z-index of its plate (earthquakes, volcanic eruptions).
  data.forEach(chunkData => renderChunkOverlay(ctx, chunkData));
}
