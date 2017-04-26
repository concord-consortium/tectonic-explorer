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

const π = Math.PI,
      { acos, asin, atan2, cos, sin, sqrt, pow } = Math;

const PEELS = 5;

/**
 * ONLY USES VALUES IN RADIANS.
 * LONGITUDE AND LATITUDE ARE LIKE EARTH'S.
 */

const L = acos(sqrt(5) / 5); // the spherical arclength of the icosahedron's edges.

/**
 * Returns the arc length between two positions.
 *
 * @return {number} arc length
 */
function distance(f1_φ, f1_λ, f2_φ, f2_λ) {
  return 2 * asin(sqrt(
      pow(sin((f1_φ - f2_φ) / 2), 2) +
      cos(f1_φ) * cos(f2_φ) * pow(sin((f1_λ - f2_λ) / 2), 2)
    ));
}

/**
 * Returns the course between two positions.
 *
 * @param {object} pos1
 *
 * @param {object} pos2
 *
 * @returns {object} course
 * @returns {number} course.a - the heading at pos1 in radians clockwise from the local meridian
 * @returns {number} course.d - the distance traveled
 */
function course(pos1, pos2) {

  var f1_φ = pos1[0],
      f1_λ = pos1[1],
      f2_φ = pos2[0],
      f2_λ = pos2[1];

  var d = distance(f1_φ, f1_λ, f2_φ, f2_λ), a, course = {};

  if (sin(f2_λ - f1_λ) < 0) {
    a = acos((sin(f2_φ) - sin(f1_φ) * cos(d)) / (sin(d) * cos(f1_φ)));
  } else {
    a = 2 * π - acos((sin(f2_φ) - sin(f1_φ) * cos(d)) / (sin(d) * cos(f1_φ)));
  }

  course.d = d;
  course.a = a;

  return course;
}

/**
 * Returns the position halfway between two positions.
 * Chiefly used to test `interpolate`.
 *
 * @param {object} pos1
 * @param {number} pos1.φ - first latitude in radians
 * @param {number} pos1.λ - first longitude in radians
 *
 * @param {object} pos2
 * @param {number} pos2.φ - second latitude in radians
 * @param {number} pos2.λ - second longitude in radians
 *
 * @return {object} pos3 - result
 * @return {number} pos3.φ - result latitude in radians
 * @return {number} pos3.λ - result longitude in radians
 */
function midpoint(pos1, pos2) {
  var Bx = Math.cos(pos2.φ) * Math.cos(pos2.λ - pos1.λ);
  var By = Math.cos(pos2.φ) * Math.sin(pos2.λ - pos1.λ);

  return {
    φ: atan2(sin(pos1.φ) + sin(pos2.φ),
      sqrt((cos(pos1.φ) + Bx) * (cos(pos1.φ) + Bx) + By * By)),
    λ: pos1.λ + atan2(By, cos(pos1.φ) + Bx)
  };
}

/**
 * Populates buffer `buf` with `d - 1` evenly-spaced positions between two points.
 *
 * @param {number} f1_φ - first position's φ value
 * @param {number} f1_λ - first position's λ value
 *
 * @param {number} f2_φ - second position's φ value
 * @param {number} f2_λ - second position's λ value
 *
 * @param {number} d - number of times to divide the segment between the positions
 * @param {ArrayBuffer} buf - buffer in which to store the result
 */
function interpolate(f1_φ, f1_λ, f2_φ, f2_λ, d, buf) {

  for (var i = 1; i < d; i += 1) {

    let f = i / d,
        Δ = distance(f1_φ, f1_λ, f2_φ, f2_λ);

    let A = sin((1 - f) * Δ) / sin(Δ),
        B = sin(f * Δ) / sin(Δ);

    let x = A * cos(f1_φ) * cos(f1_λ) + B * cos(f2_φ) * cos(f2_λ),
        z = A * cos(f1_φ) * sin(f1_λ) + B * cos(f2_φ) * sin(f2_λ),
        y = A * sin(f1_φ) + B * sin(f2_φ);

    let φ = atan2(y, sqrt(pow(x, 2) + pow(z, 2))),
        λ = atan2(z, x);

    buf[2 * (i - 1) + 0] = φ;
    buf[2 * (i - 1) + 1] = λ;

  }

}

/**
 * Populates buffer `buf` from offset `b` with the center point of positions provided
 *
 * @param buf - buffer in which to store the result
 * @param b - offset in `buf` from which to begin storing the result
 * @param p - an even number of remaining arguments as pairs of coordinates for each position
 */
function centroid(buf, b, ...p) {

  var n = p.length / 2;

  var sum_x = 0,
      sum_z = 0,
      sum_y = 0;

  for (let i = 0; i < n; i += 1) {

    let i_φ = p[2 * i + 0],
        i_λ = p[2 * i + 1];

    sum_x += cos(i_φ) * cos(i_λ);
    sum_z += cos(i_φ) * sin(i_λ);
    sum_y += sin(i_φ);

  }

  var x = sum_x / n,
      z = sum_z / n,
      y = sum_y / n;

  var r = sqrt(
    x * x + z * z + y * y
  );

  var φ = asin(y / r),
      λ = atan2(z, x);

  buf[b + 0] = φ;
  buf[b + 1] = λ;

}

/**
 * Sets the barycenter position of every field on a Sphere.
 * @this {Sphere}
 */
function populate() {

  var d     = this._divisions,
      max_x = 2 * d - 1,
      buf   = new Float64Array((d - 1) * 2);

  this._positions = new Float64Array(( 5 * 2 * d * d + 2 ) * 2);

  // Determine position for polar and tropical fields using only arithmetic.

  this._Fields[0]._setPosition(π / 2, 0);
  this._Fields[1]._setPosition(π / -2, 0);

  for (let s = 0; s < PEELS; s += 1) {

    let λNorth = s * 2 / 5 * π,
        λSouth = s * 2 / 5 * π + π / 5;

    this.get(s, d - 1, 0)._setPosition(π / 2 - L, λNorth);
    this.get(s, max_x, 0)._setPosition(π / -2 + L, λSouth);

  }

  // Determine positions for the fields along the edges using arc interpolation.

  if ((d - 1) > 0) { // d must be at least 2 for there to be fields between vertices.

    for (let s = 0; s < PEELS; s += 1) {

      let p = (s + 4) % PEELS;

      let snP = 0,
          ssP = 1,
          cnT = this.get(s, d - 1, 0)._i,
          pnT = this.get(p, d - 1, 0)._i,
          csT = this.get(s, max_x, 0)._i,
          psT = this.get(p, max_x, 0)._i;

      // north pole to current north tropical pentagon

      interpolate(
        this._positions[2 * snP + 0],
        this._positions[2 * snP + 1],
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, i - 1, 0)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

      // current north tropical pentagon to previous north tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * pnT + 0],
        this._positions[2 * pnT + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, d - 1 - i, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

      // current north tropical pentagon to previous south tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * psT + 0],
        this._positions[2 * psT + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, d - 1, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

      // current north tropical pentagon to current south tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, d - 1 + i, 0)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

      // current south tropical pentagon to previous south tropical pentagon

      interpolate(
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        this._positions[2 * psT + 0],
        this._positions[2 * psT + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, max_x - i, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

      // current south tropical pentagon to south pole

      interpolate(
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        this._positions[2 * ssP + 0],
        this._positions[2 * ssP + 1],
        d,
        buf
      );

      for (let i = 1; i < d; i += 1)
        this.get(s, max_x, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

    }

  }

  // Determine positions for fields between edges using interpolation.

  if ((d - 2) > 0) { // d must be at least 3 for there to be fields not along edges.

    for (let s = 0; s < PEELS; s += 1) {

      for (let x = 0; x < d * 2; x += 1) {

        // for each column, fill in values for fields between edge fields,
        // whose positions were defined in the previous block.

        if ((x + 1) % d > 0) { // ignore the columns that are edges.

          let j  = d - ((x + 1) % d), // the y index of the field in this column that is along a diagonal edge
              n1 = j - 1, // the number of unpositioned fields before j
              n2 = d - 1 - j, // the number of unpositioned fields after j
              f1 = this.get(s, x, 0)._i, // the field along the early edge
              f2 = this.get(s, x, j)._i, // the field along the diagonal edge
              f3 = this.get(s, x, d - 1)._adjacentFields[2]._i; // the field along the later edge,
                                                                // which will necessarily belong to
                                                                // another section.

          interpolate(
            this._positions[2 * f1 + 0],
            this._positions[2 * f1 + 1],
            this._positions[2 * f2 + 0],
            this._positions[2 * f2 + 1],
            n1 + 1,
            buf
          );

          for (let i = 1; i < j; i += 1)
            this.get(s, x, i)
              ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1]);

          interpolate(
            this._positions[2 * f2 + 0],
            this._positions[2 * f2 + 1],
            this._positions[2 * f3 + 0],
            this._positions[2 * f3 + 1],
            n2 + 1,
            buf
          );

          for (let i = j + 1; i < d; i += 1)
            this.get(s, x, i)
              ._setPosition(buf[2 * (i - j - 1) + 0], buf[2 * (i - j - 1) + 1]);

        }

      }

    }

  }

}

module.exports = {
  populate,
  centroid,
  midpoint,
  interpolate,
  course,
  distance
};