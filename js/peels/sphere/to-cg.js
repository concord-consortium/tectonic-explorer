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

import populateInterfieldData from './inter-field'
import intArr from './int-arr'

const { cos, sin } = Math

/**
 * Creates edges **between field barycenters** and returns an array of vertices
 * and a corresponding array of faces to use in three.js. Bear in mind, this is
 * not necessarily the most accurate representation of the model.
 *
 * @param sphere
 * @param [options]
 * @param done
 */
function barycenterVerticesAndFaces (sphere, options, done) {
  var n = sphere._Fields.length

  var positions = new Float32Array(n * 3)

  var indices = sphere._interfieldTriangles

  var colors = new Float32Array(indices.length * 3)

  for (let f = 0; f < sphere._Fields.length; f += 1) {
    let field = sphere._Fields[f]

    let fφ = sphere._positions[2 * f + 0]

    let fλ = sphere._positions[2 * f + 1]

    let color = options.colorFn.call(field)

    positions[f * 3 + 0] = cos(fφ) * cos(fλ) // x
    positions[f * 3 + 2] = cos(fφ) * sin(fλ) // z
    positions[f * 3 + 1] = sin(fφ) // y

    colors[f * 3 + 0] = color.r
    colors[f * 3 + 1] = color.g
    colors[f * 3 + 2] = color.b
  }

  // normals are exactly positions, as long as radius is 1
  var normals = positions.slice(0)

  if (done) {
    done(null, {
      positions,
      normals,
      indices,
      colors
    })
  }
}

/**
 * Creates edges between actual fields and returns an array of vertices and a
 * corresponding array of faces to use in three.js. This representation of the
 * model is popularly depicted in the reference materials.
 *
 * @param sphere
 * @param options
 * @param done
 */
function fieldVerticesAndFaces (sphere, options, done) {
  // counter-clockwise face-vertex orders

  const PENT_FACES = [0, 2, 1, /**/ 0, 4, 2, /**/ 4, 3, 2]

  const HEX_FACES = [0, 2, 1, /**/ 0, 3, 2, /**/ 0, 5, 3, /**/ 5, 4, 3]

  const PENT_FACES_CW = [1, 2, 0, /**/ 2, 4, 0, /**/ 2, 3, 4]

  var interfieldTriangles = sphere._interfieldTriangles

  var nPolyEdgeVerts = interfieldTriangles.length / 3

  var nPolys = sphere._Fields.length

  var nDistinctVertices = nPolys * 6 - 12
  // 6 vertices for each poly (-12 vertices for the 12 pentagons)

  var nTriangles = nPolys * 4 - 12 // 4 triangles to each hexagon, 3 to each pentagon of which there are 12.

  // support maps
  var fieldPosMap = intArr(nDistinctVertices, nPolys)

  var indexedPositions = new Float32Array(nPolyEdgeVerts * 3)

  // maps for the GPU
  var indices = intArr(nDistinctVertices, nTriangles * 3)

  var positions = new Float32Array(nDistinctVertices * 3)

  var normals = new Float32Array(nDistinctVertices * 3)

  var uvs = new Float32Array(nDistinctVertices * 2)

  var colors = new Float32Array(nDistinctVertices * 4)

  // populate the cartesian coordinates of positions

  for (let v = 0; v < nPolyEdgeVerts; v += 1) {
    let cφ = sphere._interfieldCentroids[2 * v + 0]

    let cλ = sphere._interfieldCentroids[2 * v + 1]

    indexedPositions[3 * v + 0] = cos(cφ) * cos(cλ) // x
    indexedPositions[3 * v + 2] = cos(cφ) * sin(cλ) // z
    indexedPositions[3 * v + 1] = sin(cφ) // y
  }

  var c = 0; var t = 0

  for (let f = 0; f < nPolys; f += 1) {
    let field = sphere._Fields[f]

    let sides = field._adjacentFields.length

    let color = options.colorFn.call(field)

    let fφ = sphere._positions[2 * f + 0]

    let fλ = sphere._positions[2 * f + 1]

    let polyPosIndices = []

    fieldPosMap[f] = c

    for (let s = 0; s < sides; s += 1) {
      let cc = (c + s)

      let fi = sphere._interfieldIndices[6 * f + s]

      polyPosIndices.push(fi)

      const x = indexedPositions[fi * 3 + 0]
      const y = indexedPositions[fi * 3 + 1]
      const z = indexedPositions[fi * 3 + 2]

      positions[cc * 3 + 0] = x
      positions[cc * 3 + 1] = y
      positions[cc * 3 + 2] = z

      uvs[cc * 2 + 0] = 0.5 + Math.atan2(z, x) / (2 * Math.PI)
      uvs[cc * 2 + 1] = 0.5 - Math.asin(y) / Math.PI

      colors[cc * 4 + 0] = color.r
      colors[cc * 4 + 1] = color.g
      colors[cc * 4 + 2] = color.b
      colors[cc * 4 + 3] = color.a != null ? color.a : 1.0

      normals[cc * 3 + 0] = cos(fφ) * cos(fλ)
      normals[cc * 3 + 2] = cos(fφ) * sin(fλ)
      normals[cc * 3 + 1] = sin(fφ)
    }

    let faces

    if (f === 1) {
      faces = PENT_FACES_CW
    } else {
      faces = sides === 5 ? PENT_FACES : HEX_FACES
    }

    for (let v = 0; v < faces.length; v += 1) {
      let tt = (t + v)

      indices[tt] = c + faces[v]
    }

    c += sides
    t += faces.length
  }

  done(null, {
    positions,
    indices,
    normals,
    uvs,
    colors
  })
}

function getVerticesAndFaces (options, done) {
  populateInterfieldData.call(this)
  // will route to different algorithms depending on options, but only does barycenter technique for now.
  switch (options.type) {
    case 'poly-per-field':
      return fieldVerticesAndFaces(this, options, done)
    case 'vertex-per-field':
    default:
      return barycenterVerticesAndFaces(this, options, done)
  }
}

export default getVerticesAndFaces
