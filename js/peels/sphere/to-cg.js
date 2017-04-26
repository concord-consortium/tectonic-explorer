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

const populateInterfieldData = require('./inter-field'),
      intArr                 = require('./int-arr');

const { cos, sin } = Math;

/**
 * Creates edges **between field barycenters** and returns an array of vertices
 * and a corresponding array of faces to use in three.js. Bear in mind, this is
 * not necessarily the most accurate representation of the model.
 *
 * @param sphere
 * @param [options]
 * @param done
 */
function barycenterVerticesAndFaces(sphere, options, done) {

  var n         = sphere._Fields.length,
      positions = new Float32Array(n * 3),
      indices   = sphere._interfieldTriangles,
      colors    = new Float32Array(indices.length * 3);

  for (let f = 0; f < sphere._Fields.length; f += 1) {

    let field = sphere._Fields[f],
        f_φ   = sphere._positions[2 * f + 0],
        f_λ   = sphere._positions[2 * f + 1],
        color = options.colorFn.call(field);

    positions[f * 3 + 0] = cos(f_φ) * cos(f_λ); // x
    positions[f * 3 + 2] = cos(f_φ) * sin(f_λ); // z
    positions[f * 3 + 1] = sin(f_φ); // y

    colors[f * 3 + 0] = color.r;
    colors[f * 3 + 1] = color.g;
    colors[f * 3 + 2] = color.b;

  }

  // normals are exactly positions, as long as radius is 1
  var normals = positions.slice(0);

  if (done) done.call(null, null, {
    positions,
    normals,
    indices,
    colors
  });

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
function fieldVerticesAndFaces(sphere, options, done) {

  // counter-clockwise face-vertex orders

  const PENT_FACES    = [0, 2, 1, /**/ 0, 4, 2, /**/ 4, 3, 2],
        HEX_FACES     = [0, 2, 1, /**/ 0, 3, 2, /**/ 0, 5, 3, /**/ 5, 4, 3],

        PENT_FACES_CW = [1, 2, 0, /**/ 2, 4, 0, /**/ 2, 3, 4];

  var interfieldTriangles = sphere._interfieldTriangles,
      nPolyEdgeVerts      = interfieldTriangles.length / 3,
      nPolys              = sphere._Fields.length;

  var nDistinctVertices = nPolys * 6 - 12, // 6 vertices for each poly (-12 vertices for the 12 pentagons)
      nTriangles        = nPolys * 4 - 12; // 4 triangles to each hexagon, 3 to each pentagon of which there are 12.

  // support maps
  var fieldPosMap      = intArr(nDistinctVertices, nPolys),
      indexedPositions = new Float32Array(nPolyEdgeVerts * 3);

  // maps for the GPU
  var indices   = intArr(nDistinctVertices, nTriangles * 3),
      positions = new Float32Array(nDistinctVertices * 3),
      normals   = new Float32Array(nDistinctVertices * 3),
      colors    = new Float32Array(nDistinctVertices * 4);

  // populate the cartesian coordinates of positions

  for (let v = 0; v < nPolyEdgeVerts; v += 1) {

    let c_φ = sphere._interfieldCentroids[2 * v + 0],
        c_λ = sphere._interfieldCentroids[2 * v + 1];

    indexedPositions[3 * v + 0] = cos(c_φ) * cos(c_λ); // x
    indexedPositions[3 * v + 2] = cos(c_φ) * sin(c_λ); // z
    indexedPositions[3 * v + 1] = sin(c_φ); // y

  }

  var c = 0, t = 0;

  for (let f = 0; f < nPolys; f += 1) {

    let field          = sphere._Fields[f],
        sides          = field._adjacentFields.length,
        color          = options.colorFn.call(field),
        f_φ            = sphere._positions[2 * f + 0],
        f_λ            = sphere._positions[2 * f + 1],
        polyPosIndices = [];

    fieldPosMap[f] = c;

    for (let s = 0; s < sides; s += 1) {

      let cc = (c + s),
          fi = sphere._interfieldIndices[6 * f + s];

      polyPosIndices.push(fi);

      positions[cc * 3 + 0] = indexedPositions[fi * 3 + 0];
      positions[cc * 3 + 1] = indexedPositions[fi * 3 + 1];
      positions[cc * 3 + 2] = indexedPositions[fi * 3 + 2];

      colors[cc * 4 + 0] = color.r;
      colors[cc * 4 + 1] = color.g;
      colors[cc * 4 + 2] = color.b;
      colors[cc * 4 + 3] = color.a != null ? color.a : 1.0;

      normals[cc * 3 + 0] = cos(f_φ) * cos(f_λ);
      normals[cc * 3 + 2] = cos(f_φ) * sin(f_λ);
      normals[cc * 3 + 1] = sin(f_φ);

    }

    let faces;

    if (f === 1) {
      faces = PENT_FACES_CW;
    } else {
      faces = sides === 5 ? PENT_FACES : HEX_FACES;
    }

    for (let v = 0; v < faces.length; v += 1) {

      let tt = (t + v);

      indices[tt] = c + faces[v];

    }

    c += sides;
    t += faces.length;

  }

  done.call(null, null, {
    positions,
    indices,
    normals,
    colors
  });

}

function getVerticesAndFaces(options, done) {
  populateInterfieldData.call(this);
  // will route to different algorithms depending on options, but only does barycenter technique for now.
  switch (options.type) {
    case 'poly-per-field':
      return fieldVerticesAndFaces(this, options, done);
      break;
    case 'vertex-per-field':
    default:
      return barycenterVerticesAndFaces(this, options, done);
      break;
  }
}

module.exports = getVerticesAndFaces;