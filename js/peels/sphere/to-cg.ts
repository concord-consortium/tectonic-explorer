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

import populateInterfieldData from "./inter-field";
import intArr from "./int-arr";

const { cos, sin } = Math;

interface IOptions {
  type: "poly-per-field" | "vertex-per-field";
  colorFn: (field: any) => { r: number; g: number; b: number; a: number };
}

interface IAttributesResult {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array | Uint32Array | Array<number>;
  colors: Float32Array;
  uvs?: Float32Array;
}

/**
 * Creates edges **between field barycenters** and returns an array of vertices
 * and a corresponding array of faces to use in three.js. Bear in mind, this is
 * not necessarily the most accurate representation of the model.
 *
 * @param sphere
 * @param [options]
 */
function barycenterVerticesAndFaces(sphere: any, options: IOptions) {
  const n = sphere._Fields.length;

  const positions = new Float32Array(n * 3);

  const indices = sphere._interfieldTriangles;

  const colors = new Float32Array(indices.length * 3);

  for (let f = 0; f < sphere._Fields.length; f += 1) {
    const field = sphere._Fields[f];

    const fφ = sphere._positions[2 * f + 0];

    const fλ = sphere._positions[2 * f + 1];

    const color = options.colorFn.call(field);

    positions[f * 3 + 0] = cos(fφ) * cos(fλ); // x
    positions[f * 3 + 2] = cos(fφ) * sin(fλ); // z
    positions[f * 3 + 1] = sin(fφ); // y

    colors[f * 3 + 0] = color.r;
    colors[f * 3 + 1] = color.g;
    colors[f * 3 + 2] = color.b;
  }

  // normals are exactly positions, as long as radius is 1
  const normals = positions.slice(0);

  return {
    positions,
    normals,
    indices,
    colors
  };
}

/**
 * Creates edges between actual fields and returns an array of vertices and a
 * corresponding array of faces to use in three.js. This representation of the
 * model is popularly depicted in the reference materials.
 *
 * @param sphere
 * @param options
 */
function fieldVerticesAndFaces(sphere: any, options: IOptions) {
  // counter-clockwise face-vertex orders

  const PENT_FACES = [0, 2, 1, /**/ 0, 4, 2, /**/ 4, 3, 2];

  const HEX_FACES = [0, 2, 1, /**/ 0, 3, 2, /**/ 0, 5, 3, /**/ 5, 4, 3];

  const PENT_FACES_CW = [1, 2, 0, /**/ 2, 4, 0, /**/ 2, 3, 4];

  const interfieldTriangles = sphere._interfieldTriangles;

  const nPolyEdgeVerts = interfieldTriangles.length / 3;

  const nPolys = sphere._Fields.length;

  const nDistinctVertices = nPolys * 6 - 12;
  // 6 vertices for each poly (-12 vertices for the 12 pentagons)

  const nTriangles = nPolys * 4 - 12; // 4 triangles to each hexagon, 3 to each pentagon of which there are 12.

  // support maps
  const fieldPosMap = intArr(nDistinctVertices, nPolys);

  const indexedPositions = new Float32Array(nPolyEdgeVerts * 3);

  // maps for the GPU
  const indices = intArr(nDistinctVertices, nTriangles * 3);

  const positions = new Float32Array(nDistinctVertices * 3);

  const normals = new Float32Array(nDistinctVertices * 3);

  const uvs = new Float32Array(nDistinctVertices * 2);

  const colors = new Float32Array(nDistinctVertices * 4);

  // populate the cartesian coordinates of positions

  for (let v = 0; v < nPolyEdgeVerts; v += 1) {
    const cφ = sphere._interfieldCentroids[2 * v + 0];

    const cλ = sphere._interfieldCentroids[2 * v + 1];

    indexedPositions[3 * v + 0] = cos(cφ) * cos(cλ); // x
    indexedPositions[3 * v + 2] = cos(cφ) * sin(cλ); // z
    indexedPositions[3 * v + 1] = sin(cφ); // y
  }

  let c = 0; let t = 0;

  for (let f = 0; f < nPolys; f += 1) {
    const field = sphere._Fields[f];

    const sides = field._adjacentFields.length;

    const color = options.colorFn.call(field);

    const fφ = sphere._positions[2 * f + 0];

    const fλ = sphere._positions[2 * f + 1];

    const polyPosIndices = [];

    fieldPosMap[f] = c;

    for (let s = 0; s < sides; s += 1) {
      const cc = (c + s);

      const fi = sphere._interfieldIndices[6 * f + s];

      polyPosIndices.push(fi);

      const x = indexedPositions[fi * 3 + 0];
      const y = indexedPositions[fi * 3 + 1];
      const z = indexedPositions[fi * 3 + 2];

      positions[cc * 3 + 0] = x;
      positions[cc * 3 + 1] = y;
      positions[cc * 3 + 2] = z;

      uvs[cc * 2 + 0] = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
      uvs[cc * 2 + 1] = 0.5 - Math.asin(y) / Math.PI;

      colors[cc * 4 + 0] = color.r;
      colors[cc * 4 + 1] = color.g;
      colors[cc * 4 + 2] = color.b;
      colors[cc * 4 + 3] = color.a != null ? color.a : 1.0;

      normals[cc * 3 + 0] = cos(fφ) * cos(fλ);
      normals[cc * 3 + 2] = cos(fφ) * sin(fλ);
      normals[cc * 3 + 1] = sin(fφ);
    }

    let faces;

    if (f === 1) {
      faces = PENT_FACES_CW;
    } else {
      faces = sides === 5 ? PENT_FACES : HEX_FACES;
    }

    for (let v = 0; v < faces.length; v += 1) {
      const tt = (t + v);

      indices[tt] = c + faces[v];
    }

    c += sides;
    t += faces.length;
  }

  return {
    positions,
    indices,
    normals,
    uvs,
    colors
  };
}

function getVerticesAndFaces(options: IOptions): IAttributesResult {
  populateInterfieldData.call(this);
  // will route to different algorithms depending on options, but only does barycenter technique for now.
  switch (options.type) {
  case "poly-per-field":
    return fieldVerticesAndFaces(this, options);
  case "vertex-per-field":
  default:
    return barycenterVerticesAndFaces(this, options);
  }
}

export default getVerticesAndFaces;
