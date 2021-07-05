import Model from "../js/plates-model/model";
import Plate from "../js/plates-model/plate";
import Field from "../js/plates-model/field";
import Subplate from "../js/plates-model/subplate";

export function compareModels(m1: Model, m2: Model) {
  expect(m1.stepIdx).toEqual(m2.stepIdx);
  expect(m1.time).toEqual(m2.time);
  expect(m1.plates.length).toEqual(m2.plates.length);
  m1.plates.forEach((p1: Plate, i: number) => {
    const p2 = m2.plates[i];
    comparePlates(p1, p2);
  });
}

export function comparePlates(p1: Plate, p2: Plate) {
  expect(p1.id).toEqual(p2.id);
  expect(p1.quaternion).toEqual(p2.quaternion);
  expect(p1.angularVelocity).toEqual(p2.angularVelocity);
  expect(p1.invMomentOfInertia).toEqual(p2.invMomentOfInertia);
  expect(p1.density).toEqual(p2.density);
  expect(p1.hue).toEqual(p2.hue);
  expect(p1.size).toEqual(p2.size);
  p1.fields.forEach((f1: Field) => {
    const f2 = p2.fields.get(f1.id);
    if (f2) {
      compareFields(f1, f2);
    } else {
      expect("second field").toEqual("doesn't exist");
    }
  });
  expect(p1.adjacentFields.size).toEqual(p2.adjacentFields.size);
  p1.adjacentFields.forEach((f1: Field) => {
    const f2 = p2.adjacentFields.get(f1.id);
    if (f2) {
      compareFields(f1, f2);  
    } else {
      expect("second field").toEqual("doesn't exist");
    }
  });
  compareSubplates(p1.subplate, p2.subplate);
}

export function compareSubplates(p1: Subplate, p2: Subplate) {
  expect(p1.id).toEqual(p2.id);
  expect(p1.quaternion).toEqual(p2.quaternion);
  expect(p1.angularVelocity).toEqual(p2.angularVelocity);
  expect(p1.size).toEqual(p2.size);
  p1.fields.forEach((f1: Field) => {
    const f2 = p2.fields.get(f1.id);
    if (f2) {
      compareFields(f1, f2);
    } else {
      expect("second field").toEqual("doesn't exist");
    }
  });
}

export function compareFields(f1: Field, f2: Field) {
  expect(f1.elevation).not.toBeNaN();
  expect(f2.elevation).not.toBeNaN();
  expect(f1.elevation).toEqual(f2.elevation);
  expect(f1.crustThickness).toEqual(f2.crustThickness);
  expect(f1.absolutePos).toEqual(f2.absolutePos);
  expect(f1.force).toEqual(f2.force);
  expect(f1.age).toEqual(f2.age);
  expect(f1.mass).toEqual(f2.mass);
  expect(f1.boundary).toEqual(f2.boundary);
  expect(f1.noCollisionDist).toEqual(f2.noCollisionDist);
  expect(f1.subduction?.progress).toEqual(f2.subduction?.progress);
  expect(f1.draggingPlate?.id).toEqual(f2.draggingPlate?.id);
  compareHelpers(f1.subduction, f2.subduction);
  compareHelpers(f1.volcanicAct, f2.volcanicAct);
  compareHelpers(f1.earthquake, f2.earthquake);
  compareHelpers(f1.volcanicEruption, f2.volcanicEruption);
  compareHelpers(f1.crust, f2.crust);
}

export function compareHelpers(h1: any, h2: any) {
  if (h1 === undefined && h2 === undefined) {
    return;
  }
  if (h1 === undefined && h2 !== undefined || h1 !== undefined && h2 === undefined) {
    expect(h1).toEqual(h2);
  }
  Object.keys(h1).forEach(propName => {
    if (propName !== "field") {
      expect(propName + h1[propName]).toEqual(propName + h2[propName]);
    }
  });
}
