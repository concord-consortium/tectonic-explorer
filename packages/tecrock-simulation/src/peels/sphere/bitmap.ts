"use strict";

export default class Bitmap {
  _bits: any;
  _h: any;
  _w: any;
  
  constructor(width: any, height: any) {
    this._bits = new Uint8Array(Math.ceil(width * height / 8));

    this._w = width;
    this._h = height;
  }

  clear(width: any, height: any, offsetX: any, offsetY: any) {
    const oX = offsetX || 0;

    const oY = offsetY || 0;

    const w = Math.min(width, this._w - oX);

    const h = Math.min(height, this._h - oY);

    for (let x = oX; x < w; x += 1) {
      for (let y = oY; y < h; y += 1) {
        this.write(x, y, false);
      }
    }

    return this;
  }

  write(x: any, y: any, val: any) {
    if (val) {
      this._bits[Math.floor((x * this._h + y) / 8)] |= (1 << ((x * this._h + y) % 8));
    } else {
      this._bits[Math.floor((x * this._h + y) / 8)] &= ~(1 << ((x * this._h + y) % 8));
    }

    return this;
  }

  get(x: any, y: any) {
    return !!((
      this._bits[Math.floor((x * this._h + y) / 8)] >> ((x * this._h + y) % 8)
    ) & 1);
  }
}
