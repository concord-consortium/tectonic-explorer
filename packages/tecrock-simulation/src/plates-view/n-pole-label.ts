import * as THREE from "three";

function font(size: any) {
  return `${size}px verdana, arial, helvetica, sans-serif`;
}

function labelTexture(label: any) {
  const width = 512;
  const height = 256;
  const shadowBlur = height / 4;
  const tickMarHeight = height / 14;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = shadowBlur;
  ctx.fillStyle = ctx.strokeStyle = "#fff";
  // Tick
  ctx.lineWidth = width / 32;
  ctx.beginPath();
  ctx.moveTo(width / 2, height / 2 - tickMarHeight);
  ctx.lineTo(width / 2, height / 2 + tickMarHeight);
  ctx.stroke();
  // Label
  ctx.font = font(height * 0.35);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, height / 4);
  const texture = new THREE.Texture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function labelScale(size: any, aspectRatio: any) {
  size *= 2;
  return new THREE.Vector3(size * aspectRatio, size, 1);
}

export default class NPoleLabel {
  root: any;

  constructor(labelSize = 0.12) {
    this.root = new THREE.Object3D();
    const texture = labelTexture("N");
    if (texture) {
      const aspectRatio = texture.image.width / texture.image.height;
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.copy(labelScale(labelSize, aspectRatio));

      this.root.add(sprite);
    }
  }

  get position() {
    return this.root.position;
  }
}
