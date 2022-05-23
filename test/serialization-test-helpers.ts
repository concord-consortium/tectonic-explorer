import Model from "../js/plates-model/model";
import Plate from "../js/plates-model/plate";
import Field from "../js/plates-model/field";
import Subplate from "../js/plates-model/subplate";

expect.extend({
  toBePrettyClose(a, b, propName) {
    if (Math.abs(a - b) < 0.005) {
      return {
        message: () => `${propName}: ${a} and ${b} should NOT be pretty close`,
        pass: true
      };
    } else {
      return {
        message: () => `${propName}: ${a} and ${b} should be pretty close`,
        pass: false
      };
    }
  }
});

// Helper that compares two provided values. When values are numeric, it uses .toBeClose assertion.
// It handles only one level of recursion to avoid issues with circular dependencies.
export function expectValuesToBeClose(a: any, b: any, name = "", recursive = true) {
  if (a === undefined && b !== undefined || a !== undefined && b === undefined) {
    expect(a).toEqual(b); // trigger test fail
  } else if (typeof a !== typeof b) {
    expect(a).toEqual(b); // trigger test fail
  } else if (typeof a === "number") {
    expect(a).toBePrettyClose(b, name);
  } else if (typeof a === "string") {
    expect(a).toEqual(b);
  } else if (recursive && Array.isArray(a)) {
    a.forEach((value: any, idx: number) => {
      expectValuesToBeClose(value, b[idx], `${name}[${idx}]`, false);
    });
  } else if (recursive && typeof a === "object") {
    Object.keys(a).forEach(propName => {
      expectValuesToBeClose(a[propName], b[propName], `${name}.${propName}`, false);
    });
  }
}

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
  expectValuesToBeClose(p1.quaternion, p2.quaternion, "quaternion");
  expectValuesToBeClose(p1.angularVelocity, p2.angularVelocity, "angularVelocity");
  expectValuesToBeClose(p1.invMomentOfInertia, p2.invMomentOfInertia, "invMomentOfInertia");
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
  expectValuesToBeClose(p1.quaternion, p2.quaternion, "quaternion");
  expectValuesToBeClose(p1.angularVelocity, p2.angularVelocity, "angularVelocity");
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
  expect(f1.elevation).toBeCloseTo(f2.elevation);
  expect(f1.crustThickness).toBeCloseTo(f2.crustThickness);
  expectValuesToBeClose(f1.absolutePos, f2.absolutePos, "absolutePos");
  expectValuesToBeClose(f1.force, f2.force, "force");
  expect(f1.age).toBeCloseTo(f2.age);
  expect(f1.mass).toEqual(f2.mass);
  expect(f1.boundary).toEqual(f2.boundary);
  expect(f1.noCollisionDist).toBeCloseTo(f2.noCollisionDist);
  expect(f1.subduction?.progress || 0).toBeCloseTo(f2.subduction?.progress || 0);
  expect(f1.draggingPlate?.id).toEqual(f2.draggingPlate?.id);
  expectValuesToBeClose(f1.subduction, f2.subduction, "subduction");
  expectValuesToBeClose(f1.volcanicAct, f2.volcanicAct, "volcanicAct");
  expectValuesToBeClose(f1.earthquake, f2.earthquake, "earthquake");
  expectValuesToBeClose(f1.volcanicEruption, f2.volcanicEruption, "volcanicEruption");
  expectValuesToBeClose(f1.crust, f2.crust, "crust");
}
