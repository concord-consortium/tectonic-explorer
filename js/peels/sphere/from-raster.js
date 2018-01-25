/*
 * Copyright (c) 2016 Will Shown. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

const inside = require('point-in-polygon');

import Bitmap from './bitmap';

const populateInterfieldData = require('./inter-field');

const π = Math.PI,
      τ = 2 * Math.PI;

const { min, max, ceil, floor } = Math;

/**
 * Returns a field's edge vertices and its bounds. Latitudinal coordinates may be
 * greater than π if the field straddles the meridian across from 0.
 *
 * @this Field
 * @returns {{min_φ: Number, max_φ: number, min_λ: Number, max_λ: number, vertices: Array}}
 * @private
 */
function _fieldGeometry() {

  const ifi = this._parent._interfieldIndices,
        ifc = this._parent._interfieldCentroids,
        i   = this._i;

  var max_φ    = -Infinity,
      min_φ    = Infinity,
      max_λ    = -Infinity,
      min_λ    = Infinity,
      mid_λ    = this._parent._positions[2 * i + 1],
      vertices = [];

  for (let v = 0; v < this._adjacentFields.length; v += 1) {

    let φ = ifc[2 * ifi[6 * i + v] + 0],
        λ = ifc[2 * ifi[6 * i + v] + 1];

    max_φ = max(max_φ, φ);
    min_φ = min(min_φ, φ);

    max_λ = max(max_λ, λ);
    min_λ = min(min_λ, λ);

    vertices.push([λ, φ]);

  }

  if (i === 0) {
    max_φ = π / 2;
  }

  if (i === 1) {
    min_φ = π / -2;
  }

  if (i < 2) {
    min_λ = -π;
    max_λ = π;
    vertices = [
      [min_λ, max_φ],
      [max_λ, max_φ],
      [max_λ, min_φ],
      [min_λ, min_φ]
    ];
  } else if (max_λ > 0 && min_λ < 0 && (mid_λ < π / -2 || mid_λ > π / 2)) {
    // this spans the meridian, so shift negative λ values past π and recalculate latitudinal bounds

    max_λ = -Infinity;
    min_λ = Infinity;

    for (let v = 0; v < vertices.length; v += 1) {

      if (vertices[v][0] < 0) vertices[v][0] += τ;

      max_λ = max(max_λ, vertices[v][0]);
      min_λ = min(min_λ, vertices[v][0]);

    }

  }

  return {
    min_φ,
    max_φ,
    min_λ,
    max_λ,
    vertices
  };

}

/**
 * Writes booleans indicating which pixel corners lay inside a field's edges to a bitmap.
 * Returns the bounds within which writing took place.
 *
 * @param bmp - the Bitmap instance containing the grid of values
 * @param geo - result of `_fieldGeometry` analysis
 * @param w - width of the dataset
 * @param h - height of the dataset
 * @returns {{min_x: number, max_x: number, min_y: number, max_y: number}}
 * @private
 */
function _populateSelectionGrid(bmp, geo, w, h) {

  var w_rect = τ / w,
      h_rect = π / h;

  var min_x = floor(geo.min_λ / w_rect + w / 2),
      max_x = ceil(geo.max_λ / w_rect + w / 2),
      min_y = floor(geo.min_φ / h_rect + h / 2),
      max_y = ceil(geo.max_φ / h_rect + h / 2);

  for (let x = min_x; x <= max_x; x += 1) {

    for (let y = min_y; y <= max_y; y += 1) {

      bmp.write(x % w, y, inside(
        [x * w_rect - π, y * h_rect - π / 2],
        geo.vertices
      ));

    }

  }

  return {
    min_x,
    max_x,
    min_y,
    max_y
  };

}

/**
 * Returns a value from 0 to 4 indicating how many corners of a pixel lay within a
 * Field's edges.
 *
 * @param bmp – Bitmap instance
 * @param x - cartesian x-position of the pixel
 * @param y – cartesian y-position of the pixel
 * @returns {number}
 * @private
 */
function _testPoints(bmp, x, y) {

  var result = 0,
      w      = bmp._w;

  if (bmp.get((x + 0) % w, y + 0)) result++;
  if (bmp.get((x + 0) % w, y + 1)) result++;
  if (bmp.get((x + 1) % w, y + 0)) result++;
  if (bmp.get((x + 1) % w, y + 1)) result++;

  return result;

}

/**
 * A function that sets field data based on raster data. A flat array of numbers, `data`, is
 * supplied representing `height` rows of `width` identical rectangles, each rectangle comprising
 * `depth` points of data. A plate carrée projection is assumed.
 *
 * `map` is a function that receives `depth` arguments, each the weighted mean value of the data in
 * that channel, and called with each field's context. It can't be asynchronous.
 *
 * @this {Sphere}
 *
 * @param {ArrayBuffer} data
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {function} map
 */
function fromRaster(data, width, height, depth, map) {

  var sphere = this;

  populateInterfieldData.call(sphere);

  var bmp = new Bitmap(width, height);

  sphere._Fields.forEach(function (field) {

    var geo       = _fieldGeometry.call(field),
        selection = _populateSelectionGrid(bmp, geo, width, height);

    var vals   = [],
        prevW = -Infinity;

    for (let x = selection.min_x; x < selection.max_x; x += 1) {

      for (let y = selection.min_y; y < selection.max_y; y += 1) {

        let w = _testPoints(bmp, x, y) / 4;

        if (w > prevW) {
          for (let z = 0; z < depth; z += 1) {
            vals[z] = data[(height - y - 1) * width * depth + (width - x - 1) * depth + z];
          }
        }
      }

    }

    map.apply(field, vals);

    bmp.clear(
      selection.max_x - selection.min_x,
      selection.max_y - selection.min_y,
      selection.min_x,
      selection.min_y
    );

  });
}

module.exports = fromRaster;