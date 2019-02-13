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

import Bitmap from './bitmap'
import inside from 'point-in-polygon'
import populateInterfieldData from './inter-field'

const π = Math.PI

const τ = 2 * Math.PI

const { min, max, ceil, floor } = Math

/**
 * Returns a field's edge vertices and its bounds. Latitudinal coordinates may be
 * greater than π if the field straddles the meridian across from 0.
 *
 * @this Field
 * @returns {{minφ: Number, maxφ: number, minλ: Number, maxλ: number, vertices: Array}}
 * @private
 */
function _fieldGeometry () {
  const ifi = this._parent._interfieldIndices

  const ifc = this._parent._interfieldCentroids

  const i = this._i

  var maxφ = -Infinity

  var minφ = Infinity

  var maxλ = -Infinity

  var minλ = Infinity

  var midλ = this._parent._positions[2 * i + 1]

  var vertices = []

  for (let v = 0; v < this._adjacentFields.length; v += 1) {
    let φ = ifc[2 * ifi[6 * i + v] + 0]

    let λ = ifc[2 * ifi[6 * i + v] + 1]

    maxφ = max(maxφ, φ)
    minφ = min(minφ, φ)

    maxλ = max(maxλ, λ)
    minλ = min(minλ, λ)

    vertices.push([λ, φ])
  }

  if (i === 0) {
    maxφ = π / 2
  }

  if (i === 1) {
    minφ = π / -2
  }

  if (i < 2) {
    minλ = -π
    maxλ = π
    vertices = [
      [minλ, maxφ],
      [maxλ, maxφ],
      [maxλ, minφ],
      [minλ, minφ]
    ]
  } else if (maxλ > 0 && minλ < 0 && (midλ < π / -2 || midλ > π / 2)) {
    // this spans the meridian, so shift negative λ values past π and recalculate latitudinal bounds

    maxλ = -Infinity
    minλ = Infinity

    for (let v = 0; v < vertices.length; v += 1) {
      if (vertices[v][0] < 0) vertices[v][0] += τ

      maxλ = max(maxλ, vertices[v][0])
      minλ = min(minλ, vertices[v][0])
    }
  }

  return {
    minφ,
    maxφ,
    minλ,
    maxλ,
    vertices
  }
}

/**
 * Writes booleans indicating which pixel corners lay inside a field's edges to a bitmap.
 * Returns the bounds within which writing took place.
 *
 * @param bmp - the Bitmap instance containing the grid of values
 * @param geo - result of `_fieldGeometry` analysis
 * @param w - width of the dataset
 * @param h - height of the dataset
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
 * @private
 */
function _populateSelectionGrid (bmp, geo, w, h) {
  var wRect = τ / w

  var hRect = π / h

  var minX = floor(geo.minλ / wRect + w / 2)

  var maxX = ceil(geo.maxλ / wRect + w / 2)

  var minY = floor(geo.minφ / hRect + h / 2)

  var maxY = ceil(geo.maxφ / hRect + h / 2)

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      bmp.write(x % w, y, inside(
        [x * wRect - π, y * hRect - π / 2],
        geo.vertices
      ))
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY
  }
}

/**
 * Returns a value from 0 to 4 indicating how many corners of a pixel lay within a
 * Field's edges.
 *
 * @param bmp – Bitmap instance
 * @param x - cartesian x-position of the pixel
 * @param y – cartesian y-position of the pixel
 * @returns {number}
 * @private
 */
function _testPoints (bmp, x, y) {
  var result = 0

  var w = bmp._w

  if (bmp.get((x + 0) % w, y + 0)) result++
  if (bmp.get((x + 0) % w, y + 1)) result++
  if (bmp.get((x + 1) % w, y + 0)) result++
  if (bmp.get((x + 1) % w, y + 1)) result++

  return result
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
function fromRaster (data, width, height, depth, map) {
  var sphere = this

  populateInterfieldData.call(sphere)

  var bmp = new Bitmap(width, height)

  sphere._Fields.forEach(function (field) {
    var geo = _fieldGeometry.call(field)

    var selection = _populateSelectionGrid(bmp, geo, width, height)

    var vals = []

    var prevW = -Infinity

    for (let x = selection.minX; x < selection.maxX; x += 1) {
      for (let y = selection.minY; y < selection.maxY; y += 1) {
        let w = _testPoints(bmp, x, y) / 4

        if (w > prevW) {
          for (let z = 0; z < depth; z += 1) {
            vals[z] = data[(height - y - 1) * width * depth + (width - x - 1) * depth + z]
          }
        }
      }
    }

    map.apply(field, vals)

    bmp.clear(
      selection.maxX - selection.minX,
      selection.maxY - selection.minY,
      selection.minX,
      selection.minY
    )
  })
}

export default fromRaster
