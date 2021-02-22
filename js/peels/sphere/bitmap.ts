"use strict";

export default class Bitmap {
  constructor (width, height) {
    this._bits = new Uint8Array(Math.ceil(width * height / 8));

    this._w = width;
    this._h = height;
  }

  clear (width, height, offsetX, offsetY) {
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

  write (x, y, val) {
    if (val) {
      this._bits[Math.floor((x * this._h + y) / 8)] |= (1 << ((x * this._h + y) % 8));
    } else {
      this._bits[Math.floor((x * this._h + y) / 8)] &= ~(1 << ((x * this._h + y) % 8));
    }

    return this;
  }

  get (x, y) {
    return !!((
      this._bits[Math.floor((x * this._h + y) / 8)] >> ((x * this._h + y) % 8)
    ) & 1);
  }
}
