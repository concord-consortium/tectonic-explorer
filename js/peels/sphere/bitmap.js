'use strict';

export default class Bitmap {

  constructor(width, height) {

    this._bits = new Uint8Array(Math.ceil(width * height / 8));

    this._w = width;
    this._h = height;

  }

  clear(width, height, offset_x, offset_y) {

    var o_x = offset_x || 0,
        o_y = offset_y || 0,
        w   = Math.min(width, this._w - o_x),
        h   = Math.min(height, this._h - o_y);

    for (let x = o_x; x < w; x += 1) {
      for (let y = o_y; y < h; y += 1) {
        this.write(x, y, false);
      }
    }

    return this;

  }

  write(x, y, val) {

    if (!!val) {
      this._bits[Math.floor((x * this._h + y) / 8)] |= (1 << ((x * this._h + y) % 8))
    } else {
      this._bits[Math.floor((x * this._h + y) / 8)] &= ~(1 << ((x * this._h + y) % 8))
    }

    return this;

  }

  get(x, y) {

    return !!((
      this._bits[Math.floor((x * this._h + y) / 8)] >> ((x * this._h + y) % 8)
    ) & 1)

  }

}
