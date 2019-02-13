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

'use strict'

const π = Math.PI

const { acos, asin, atan2, cos, sin, sqrt, pow } = Math

const PEELS = 5

/**
 * ONLY USES VALUES IN RADIANS.
 * LONGITUDE AND LATITUDE ARE LIKE EARTH'S.
 */

const L = acos(sqrt(5) / 5) // the spherical arclength of the icosahedron's edges.

/**
 * Returns the arc length between two positions.
 *
 * @return {number} arc length
 */
export function distance (f1φ, f1λ, f2φ, f2λ) {
  return 2 * asin(sqrt(
    pow(sin((f1φ - f2φ) / 2), 2) +
      cos(f1φ) * cos(f2φ) * pow(sin((f1λ - f2λ) / 2), 2)
  ))
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
export function course (pos1, pos2) {
  var f1φ = pos1[0]

  var f1λ = pos1[1]

  var f2φ = pos2[0]

  var f2λ = pos2[1]

  var d = distance(f1φ, f1λ, f2φ, f2λ); var a; var course = {}

  if (sin(f2λ - f1λ) < 0) {
    a = acos((sin(f2φ) - sin(f1φ) * cos(d)) / (sin(d) * cos(f1φ)))
  } else {
    a = 2 * π - acos((sin(f2φ) - sin(f1φ) * cos(d)) / (sin(d) * cos(f1φ)))
  }

  course.d = d
  course.a = a

  return course
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
export function midpoint (pos1, pos2) {
  var Bx = Math.cos(pos2.φ) * Math.cos(pos2.λ - pos1.λ)
  var By = Math.cos(pos2.φ) * Math.sin(pos2.λ - pos1.λ)

  return {
    φ: atan2(sin(pos1.φ) + sin(pos2.φ),
      sqrt((cos(pos1.φ) + Bx) * (cos(pos1.φ) + Bx) + By * By)),
    λ: pos1.λ + atan2(By, cos(pos1.φ) + Bx)
  }
}

/**
 * Populates buffer `buf` with `d - 1` evenly-spaced positions between two points.
 *
 * @param {number} f1φ - first position's φ value
 * @param {number} f1λ - first position's λ value
 *
 * @param {number} f2φ - second position's φ value
 * @param {number} f2λ - second position's λ value
 *
 * @param {number} d - number of times to divide the segment between the positions
 * @param {ArrayBuffer} buf - buffer in which to store the result
 */
export function interpolate (f1φ, f1λ, f2φ, f2λ, d, buf) {
  for (var i = 1; i < d; i += 1) {
    let f = i / d

    let Δ = distance(f1φ, f1λ, f2φ, f2λ)

    let A = sin((1 - f) * Δ) / sin(Δ)

    let B = sin(f * Δ) / sin(Δ)

    let x = A * cos(f1φ) * cos(f1λ) + B * cos(f2φ) * cos(f2λ)

    let z = A * cos(f1φ) * sin(f1λ) + B * cos(f2φ) * sin(f2λ)

    let y = A * sin(f1φ) + B * sin(f2φ)

    let φ = atan2(y, sqrt(pow(x, 2) + pow(z, 2)))

    let λ = atan2(z, x)

    buf[2 * (i - 1) + 0] = φ
    buf[2 * (i - 1) + 1] = λ
  }
}

/**
 * Populates buffer `buf` from offset `b` with the center point of positions provided
 *
 * @param buf - buffer in which to store the result
 * @param b - offset in `buf` from which to begin storing the result
 * @param p - an even number of remaining arguments as pairs of coordinates for each position
 */
export function centroid (buf, b, ...p) {
  var n = p.length / 2

  var sumX = 0

  var sumZ = 0

  var sumY = 0

  for (let i = 0; i < n; i += 1) {
    let iφ = p[2 * i + 0]

    let iλ = p[2 * i + 1]

    sumX += cos(iφ) * cos(iλ)
    sumZ += cos(iφ) * sin(iλ)
    sumY += sin(iφ)
  }

  var x = sumX / n

  var z = sumZ / n

  var y = sumY / n

  var r = sqrt(
    x * x + z * z + y * y
  )

  var φ = asin(y / r)

  var λ = atan2(z, x)

  buf[b + 0] = φ
  buf[b + 1] = λ
}

/**
 * Sets the barycenter position of every field on a Sphere.
 * @this {Sphere}
 */
export function populate () {
  var d = this._divisions

  var maxX = 2 * d - 1

  var buf = new Float64Array((d - 1) * 2)

  this._positions = new Float64Array((5 * 2 * d * d + 2) * 2)

  // Determine position for polar and tropical fields using only arithmetic.

  this._Fields[0]._setPosition(π / 2, 0)
  this._Fields[1]._setPosition(π / -2, 0)

  for (let s = 0; s < PEELS; s += 1) {
    let λNorth = s * 2 / 5 * π

    let λSouth = s * 2 / 5 * π + π / 5

    this.get(s, d - 1, 0)._setPosition(π / 2 - L, λNorth)
    this.get(s, maxX, 0)._setPosition(π / -2 + L, λSouth)
  }

  // Determine positions for the fields along the edges using arc interpolation.

  if ((d - 1) > 0) { // d must be at least 2 for there to be fields between vertices.
    for (let s = 0; s < PEELS; s += 1) {
      let p = (s + 4) % PEELS

      let snP = 0

      let ssP = 1

      let cnT = this.get(s, d - 1, 0)._i

      let pnT = this.get(p, d - 1, 0)._i

      let csT = this.get(s, maxX, 0)._i

      let psT = this.get(p, maxX, 0)._i

      // north pole to current north tropical pentagon

      interpolate(
        this._positions[2 * snP + 0],
        this._positions[2 * snP + 1],
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, i - 1, 0)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }

      // current north tropical pentagon to previous north tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * pnT + 0],
        this._positions[2 * pnT + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, d - 1 - i, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }

      // current north tropical pentagon to previous south tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * psT + 0],
        this._positions[2 * psT + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, d - 1, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }

      // current north tropical pentagon to current south tropical pentagon

      interpolate(
        this._positions[2 * cnT + 0],
        this._positions[2 * cnT + 1],
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, d - 1 + i, 0)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }

      // current south tropical pentagon to previous south tropical pentagon

      interpolate(
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        this._positions[2 * psT + 0],
        this._positions[2 * psT + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, maxX - i, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }

      // current south tropical pentagon to south pole

      interpolate(
        this._positions[2 * csT + 0],
        this._positions[2 * csT + 1],
        this._positions[2 * ssP + 0],
        this._positions[2 * ssP + 1],
        d,
        buf
      )

      for (let i = 1; i < d; i += 1) {
        this.get(s, maxX, i)
          ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
      }
    }
  }

  // Determine positions for fields between edges using interpolation.

  if ((d - 2) > 0) { // d must be at least 3 for there to be fields not along edges.
    for (let s = 0; s < PEELS; s += 1) {
      for (let x = 0; x < d * 2; x += 1) {
        // for each column, fill in values for fields between edge fields,
        // whose positions were defined in the previous block.

        if ((x + 1) % d > 0) { // ignore the columns that are edges.
          let j = d - ((x + 1) % d)
          // the y index of the field in this column that is along a diagonal edge

          let n1 = j - 1
          // the number of unpositioned fields before j

          let n2 = d - 1 - j
          // the number of unpositioned fields after j

          let f1 = this.get(s, x, 0)._i
          // the field along the early edge

          let f2 = this.get(s, x, j)._i
          // the field along the diagonal edge

          let f3 = this.get(s, x, d - 1)._adjacentFields[2]._i // the field along the later edge,
          // which will necessarily belong to
          // another section.

          interpolate(
            this._positions[2 * f1 + 0],
            this._positions[2 * f1 + 1],
            this._positions[2 * f2 + 0],
            this._positions[2 * f2 + 1],
            n1 + 1,
            buf
          )

          for (let i = 1; i < j; i += 1) {
            this.get(s, x, i)
              ._setPosition(buf[2 * (i - 1) + 0], buf[2 * (i - 1) + 1])
          }

          interpolate(
            this._positions[2 * f2 + 0],
            this._positions[2 * f2 + 1],
            this._positions[2 * f3 + 0],
            this._positions[2 * f3 + 1],
            n2 + 1,
            buf
          )

          for (let i = j + 1; i < d; i += 1) {
            this.get(s, x, i)
              ._setPosition(buf[2 * (i - j - 1) + 0], buf[2 * (i - j - 1) + 1])
          }
        }
      }
    }
  }
}
