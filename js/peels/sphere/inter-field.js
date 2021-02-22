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

"use strict";

import { centroid } from "./positions";
import intArr from "./int-arr";

function getInterfieldTriangles () {
  const n = this._Fields.length;

  const triangles = intArr(n - 1, (2 * n - 4) * 3);

  for (let f = 0; f < n; f += 1) {
    const field = this._Fields[f];

    if (f > 1) { // not North or South
      const n1i = field._adjacentFields[0]._i;

      const n2i = field._adjacentFields[1]._i;

      const n3i = field._adjacentFields[2]._i;

      const f1 = f * 2 - 4;

      const f2 = f * 2 - 3;

      triangles[f1 * 3 + 0] = n2i;
      triangles[f1 * 3 + 1] = n1i;
      triangles[f1 * 3 + 2] = f;

      triangles[f2 * 3 + 0] = n3i;
      triangles[f2 * 3 + 1] = n2i;
      triangles[f2 * 3 + 2] = f;
    }
  }

  return triangles;
}

function getInterfieldCentroids () {
  const n = this._interfieldTriangles.length / 3;

  const centroids = new Float64Array(2 * n);

  for (let v = 0; v < n; v += 1) {
    centroid(
      centroids,
      2 * v,
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 0]]._i + 0],
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 0]]._i + 1],
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 1]]._i + 0],
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 1]]._i + 1],
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 2]]._i + 0],
      this._positions[2 * this._Fields[this._interfieldTriangles[3 * v + 2]]._i + 1]
    );
  }

  return centroids;
}

function _faceIndex (i, a1, a2) {
  const ts = this._interfieldTriangles;

  const f1 = i * 2 - 4;

  const f2 = i * 2 - 3;

  if (
    (ts[f1 * 3 + 1] === a1 || ts[f1 * 3 + 1] === a2) &&
    (ts[f1 * 3 + 0] === a1 || ts[f1 * 3 + 0] === a2)
  ) {
    return f1;
  }

  if (
    (ts[f2 * 3 + 1] === a1 || ts[f2 * 3 + 1] === a2) &&
    (ts[f2 * 3 + 0] === a1 || ts[f2 * 3 + 0] === a2)
  ) {
    return f2;
  }

  return -1;
}

function _getTriangleIndex (fi1, fi2, fi3) {
  let c;

  c = _faceIndex.call(this, fi1, fi2, fi3);

  if (c >= 0) return c;

  c = _faceIndex.call(this, fi2, fi1, fi3);

  if (c >= 0) return c;

  c = _faceIndex.call(this, fi3, fi1, fi2);

  if (c >= 0) return c;

  throw new Error(`Could not find triangle index for faces: ${fi1}, ${fi2}, ${fi3}`);
}

function getInterfieldIndices () {
  const n = this._Fields.length;

  const indices = intArr(this._interfieldTriangles.length / 3, 6 * n);

  for (let f = 0; f < n; f += 1) {
    const field = this._Fields[f];

    const sides = field._adjacentFields.length;

    for (let s = 0; s < sides; s += 1) {
      const a1 = field.adjacent(s)._i;

      const a2 = field.adjacent((s + 1) % sides)._i;

      indices[6 * f + s] = _getTriangleIndex.call(this, field._i, a1, a2);
    }
  }

  return indices;
}

function populateInterfieldData () {
  if (!this._interfieldTriangles) this._interfieldTriangles = getInterfieldTriangles.call(this);
  if (!this._interfieldCentroids) this._interfieldCentroids = getInterfieldCentroids.call(this);
  if (!this._interfieldIndices) this._interfieldIndices = getInterfieldIndices.call(this);
}

export default populateInterfieldData;
