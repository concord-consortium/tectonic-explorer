import * as THREE from "three";
import config from "../config";

const TEXTURE_SIZE = 64;

export function drawVolcanicEruptionShape (ctx, x, y, size) {
  const strokeWidth = size * 0.04;
  const halfStrokeWidth = strokeWidth * 0.5;
  const halfSize = size * 0.5;
  // Triangle.
  ctx.beginPath();
  ctx.moveTo(x - halfSize + halfStrokeWidth, y - halfStrokeWidth);
  ctx.lineTo(x, y - size + halfStrokeWidth);
  ctx.lineTo(x + halfSize - halfStrokeWidth, y - halfStrokeWidth);
  ctx.lineTo(x - halfSize + halfStrokeWidth, y - halfStrokeWidth);
  ctx.fillStyle = "#" + config.volcanicEruptionColor;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#000";
  ctx.stroke();
}

export function volcanicEruptionTexture () {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  drawVolcanicEruptionShape(ctx, TEXTURE_SIZE * 0.5, TEXTURE_SIZE, TEXTURE_SIZE);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}
