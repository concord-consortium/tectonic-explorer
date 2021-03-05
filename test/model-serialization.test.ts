import * as THREE from "three";
import Model from "../js/plates-model/model";
import config from "../js/config";
import Plate from "../js/plates-model/plate";
import Field from "../js/plates-model/field";
import Subplate from "../js/plates-model/subplate";

// Increase this paramter so it uses to real-world value (setup-tests.js sets a tiny value for performance reasons).
config.voronoiSphereFieldsCount = 200000;

const TIMESTEP = 0.2;

function initFunc(plates: Record<number, Plate>) {
  const bluePlate = plates[210]; // 210 hue
  const yellowPlate = plates[70]; // 70 hue
  const purplePlate = plates[300]; // 300 hue
  yellowPlate.density = 0;
  bluePlate.density = 1;
  purplePlate.density = 2;
  yellowPlate.setHotSpot(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
}

function compareModels(m1: Model, m2: Model) {
  expect(m1.stepIdx).toEqual(m2.stepIdx);
  expect(m1.time).toEqual(m2.time);
  expect(m1.plates.length).toEqual(m2.plates.length);
  m1.plates.forEach((p1: Plate, i: number) => {
    const p2 = m2.plates[i];
    comparePlates(p1, p2);
  });
}

function comparePlates(p1: Plate, p2: Plate) {
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

function compareSubplates(p1: Subplate, p2: Subplate) {
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

function compareFields(f1: Field, f2: Field) {
  expect(f1.elevation).toEqual(f2.elevation);
  expect(f1.crustThickness).toEqual(f2.crustThickness);
  expect(f1.absolutePos).toEqual(f2.absolutePos);
  expect(f1.force).toEqual(f2.force);
  expect(f1.age).toEqual(f2.age);
  expect(f1.mass).toEqual(f2.mass);
  expect(f1.isIsland).toEqual(f2.isIsland);
  expect(f1.isOcean).toEqual(f2.isOcean);
  expect(f1.boundary).toEqual(f2.boundary);
  expect(f1.noCollisionDist).toEqual(f2.noCollisionDist);
  expect(f1.subduction?.progress).toEqual(f2.subduction?.progress);
  expect(f1.draggingPlate?.id).toEqual(f2.draggingPlate?.id);
  compareHelpers(f1.subduction, f2.subduction);
  compareHelpers(f1.orogeny, f2.orogeny);
  compareHelpers(f1.volcanicAct, f2.volcanicAct);
  compareHelpers(f1.earthquake, f2.earthquake);
  compareHelpers(f1.volcanicEruption, f2.volcanicEruption);
  compareHelpers(f1.crust, f2.crust);
}

function compareHelpers(h1: any, h2: any) {
  if (h1 === undefined && h2 === undefined) {
    return;
  }
  Object.keys(h1).forEach(propName => {
    if (propName !== "field") {
      expect(propName + h1[propName]).toEqual(propName + h2[propName]);
    }
  });
}

let modelImgData: ImageData | null = null;

beforeAll(done => {
  (global as any).getModelImage("testModel.png", (imgData: ImageData) => {
    modelImgData = imgData;
    done();
  });
});

// eslint-disable-next-line jest/expect-expect
test("model serialization", () => {
  const model1 = new Model(modelImgData, initFunc);
  compareModels(Model.deserialize(model1.serialize()), model1);
  // 200 steps so we get to some interesting state.
  for (let i = 0; i < 200; i++) {
    model1.step(TIMESTEP);
  }
  const model1Data = model1.serialize();
  const model2 = Model.deserialize(model1Data);
  compareModels(model2, model1);

  // Make sure that all the properties have been serialized and deserialized correctly.
  // Comparision after next 200 steps should ensure that models are identical.
  for (let i = 0; i < 200; i++) {
    model1.step(TIMESTEP);
  }
  // We can't use just one loop as random seed is set when model is created or deserialized. Creating model at this
  // point ensures that both use the same seedrandom state.
  const model3 = Model.deserialize(model1Data);
  for (let i = 0; i < 200; i++) {
    model3.step(TIMESTEP);
  }
  compareModels(model3, model1);
});
