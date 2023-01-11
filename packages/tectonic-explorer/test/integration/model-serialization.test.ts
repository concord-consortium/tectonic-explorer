import * as THREE from "three";
import Model from "../../js/plates-model/model";
import config from "../../js/config";
import Plate from "../../js/plates-model/plate";
import { compareModels } from "../serialization-test-helpers";

// Increase this parameter so it uses a real-world value (setup-tests.js sets a tiny value for performance reasons).
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

let modelImgData: ImageData | null = null;

beforeAll(done => {
  (self as any).getModelImage("testModel.png", (imgData: ImageData) => {
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
