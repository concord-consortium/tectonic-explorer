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

const PEELS = 5;

/**
 * Populates each field's _adjacentFields array.
 * Should only be used in the Fields' constructor.
 */
export default function (field) {
  const sphere = field._parent;

  const d = sphere._divisions;

  const sxy = field._sxy;

  const isPentagon = (
    (field._i < 2) ||
        (sxy[2] === 0 && ((sxy[1] + 1) % d) === 0)
  );

  const maxX = d * 2 - 1;

  const maxY = d - 1;

  // Link polar pentagons to the adjacent fields
  if (field._i === 0) {
    field._adjacentFields = [
      sphere.get(0, 0, 0),
      sphere.get(1, 0, 0),
      sphere.get(2, 0, 0),
      sphere.get(3, 0, 0),
      sphere.get(4, 0, 0)
    ];
  } else if (field._i === 1) {
    field._adjacentFields = [
      sphere.get(0, maxX, maxY),
      sphere.get(1, maxX, maxY),
      sphere.get(2, maxX, maxY),
      sphere.get(3, maxX, maxY),
      sphere.get(4, maxX, maxY)
    ];
  } else {
    const next = (sxy[0] + 1 + PEELS) % PEELS;

    const prev = (sxy[0] - 1 + PEELS) % PEELS;

    const s = sxy[0];

    const x = sxy[1];

    const y = sxy[2];

    field._adjacentFields = [];

    // 0: northwestern adjacent (x--)
    if (x > 0) {
      field._adjacentFields[0] = sphere.get(s, x - 1, y);
    } else {
      if (y === 0) {
        field._adjacentFields[0] = sphere._NORTH;
      } else {
        field._adjacentFields[0] = sphere.get(prev, y - 1, 0);
      }
    }

    // 1: western adjacent (x--, y++)
    if (x === 0) {
      // attach northwestern edge to previous north-northeastern edge
      field._adjacentFields[1] = sphere.get(prev, y, 0);
    } else {
      if (y === maxY) {
        // attach southwestern edge...
        if (x > d) {
          // ...to previous southeastern edge
          field._adjacentFields[1] = sphere.get(prev, maxX, x - d);
        } else {
          // ...to previous east-northeastern edge
          field._adjacentFields[1] = sphere.get(prev, x + d - 1, 0);
        }
      } else {
        field._adjacentFields[1] = sphere.get(s, x - 1, y + 1);
      }
    }

    // 2: southwestern adjacent (y++)
    if (y < maxY) {
      field._adjacentFields[2] = sphere.get(s, x, y + 1);
    } else {
      if (x === maxX && y === maxY) {
        field._adjacentFields[2] = sphere._SOUTH;
      } else {
        // attach southwestern edge...
        if (x >= d) {
          // ...to previous southeastern edge
          field._adjacentFields[2] = sphere.get(prev, maxX, x - d + 1);
        } else {
          // ...to previous east-northeastern edge
          field._adjacentFields[2] = sphere.get(prev, x + d, 0);
        }
      }
    }

    if (isPentagon) {
      // the last two aren't the same for pentagons

      if (x === d - 1) {
        // field is the northern tropical pentagon
        field._adjacentFields[3] = sphere.get(s, x + 1, 0);
        field._adjacentFields[4] = sphere.get(next, 0, maxY);
      } else if (x === maxX) {
        // field is the southern tropical pentagon
        field._adjacentFields[3] = sphere.get(next, d, maxY);
        field._adjacentFields[4] = sphere.get(next, d - 1, maxY);
      }
    } else {
      // 3: southeastern adjacent (x++)
      if (x === maxX) {
        field._adjacentFields[3] = sphere.get(next, y + d, maxY);
      } else {
        field._adjacentFields[3] = sphere.get(s, x + 1, y);
      }

      // 4: eastern adjacent (x++, y--)
      if (x === maxX) {
        field._adjacentFields[4] = sphere.get(next, y + d - 1, maxY);
      } else {
        if (y === 0) {
          // attach northeastern side to...
          if (x < d) {
            // ...to next northwestern edge
            field._adjacentFields[4] = sphere.get(next, 0, x + 1);
          } else {
            // ...to next west-southwestern edge
            field._adjacentFields[4] = sphere.get(next, x - d + 1, maxY);
          }
        } else {
          field._adjacentFields[4] = sphere.get(s, x + 1, y - 1);
        }
      }

      // 5: northeastern adjacent (y--)
      if (y > 0) {
        field._adjacentFields[5] = sphere.get(s, x, y - 1);
      } else {
        if (y === 0) {
          // attach northeastern side to...
          if (x < d) {
            // ...to next northwestern edge
            field._adjacentFields[5] = sphere.get(next, 0, x);
          } else {
            // ...to next west-southwestern edge
            field._adjacentFields[5] = sphere.get(next, x - d, maxY);
          }
        }
      }
    }
  }
}
