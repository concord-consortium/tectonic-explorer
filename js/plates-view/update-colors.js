export default function fieldVerticesAndFaces(sphere, options, colors) {
  const nPolys = sphere._Fields.length;
  let c = 0;
  for (let f = 0; f < nPolys; f += 1) {
    const field = sphere._Fields[f];
    const sides = field._adjacentFields.length;
    const color = options.colorFn.call(field);

    for (let s = 0; s < sides; s += 1) {
      let cc = (c + s);
      colors[cc * 3] = color.r;
      colors[cc * 3 + 1] = color.g;
      colors[cc * 3 + 2] = color.b;
    }
    c += sides;
  }
}
