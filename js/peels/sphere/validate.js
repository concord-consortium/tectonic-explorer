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

const PEELS = 5;

function _isField (field) {
  // fields have to be objects
  return field.constructor.name === 'Object';
}

module.exports = function (data) {

  if (!(
      data.hasOwnProperty('fields') &&
      data.hasOwnProperty('divisions')
  )) {
    return false
  } else {

    let d = data.divisions;

    if (!(
      d.constructor.name === 'Number' && // divisions is an integer
      d > 0 &&
      data.fields.constructor.name === 'Array' &&
      data.fields.length === d * d * 2 * PEELS + 2
    )) {
      return false
    } else {

      for(let i = 0; i < data.fields.length; i += 1){
        if(!_isField(data.fields[i])){
          return false;
        }
      }

      return true;

    }

  }

};