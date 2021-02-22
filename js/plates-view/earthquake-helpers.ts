import * as THREE from "three";

const TEXTURE_SIZE = 64;
export const EARTHQUAKE_COLORS = [
  0xFF0A00, // red
  0xFF7A00, // orange
  0xFFF700, // yellow
  0x56AB00, // light green
  0x00603F, // green
  0x0021BC // blue
];

export function drawEarthquakeShape (ctx, x, y, size, color) {
  const strokeWidth = size * 0.06;
  // Point
  ctx.beginPath();
  ctx.arc(x, y, size / 2 - strokeWidth / 2, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#000";
  ctx.stroke();
}

export function earthquakeTexture () {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  // Why is the color white? Note that in the temporal-event.js and temporal-event-fragment.glsl we set
  // custom color attribute. In the fragment shader, we multiply texture color by this custom color.
  // So, if the texture color is white, it will end up being the custom color after multiplication.
  drawEarthquakeShape(ctx, TEXTURE_SIZE * 0.5, TEXTURE_SIZE * 0.5, TEXTURE_SIZE, "#fff");
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function depthToColor (depth) {
  // Depth can be positive (earthquake above the sea level) - use 0-30km range color in this case.
  if (depth > -0.4) return EARTHQUAKE_COLORS[0];
  if (depth > -1.0) return EARTHQUAKE_COLORS[1];
  if (depth > -1.4) return EARTHQUAKE_COLORS[2];
  if (depth > -1.8) return EARTHQUAKE_COLORS[3];
  if (depth > -2.2) return EARTHQUAKE_COLORS[4];
  return EARTHQUAKE_COLORS[5];
}

export function magnitudeToSize (magnitude) {
  return 0.004 + magnitude * 0.0012;
}
