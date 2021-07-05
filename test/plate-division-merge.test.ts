import * as THREE from "three";
import Model from "../js/plates-model/model";
import config from "../js/config";
import Plate from "../js/plates-model/plate";
import { compareModels } from "./serialization-test-helpers";
import * as seedrandom from "../js/seedrandom";

// Increase this parameter so it uses to real-world value (setup-tests.js sets a tiny value for performance reasons).
config.voronoiSphereFieldsCount = 200000;

const TIMESTEP = 0.1;

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

test("plate division and merging consistency", () => {
  const model1 = new Model(modelImgData, initFunc);
  
  // Divide the first plate.
  const newPlateAdded = model1.dividePlate(model1.plates[0]);
  expect(newPlateAdded).toEqual(true);
  expect(model1.plates.length).toEqual(4);
  // New plate should be inserted right after the first plate (one that was divided). It's a fourth plate, so
  // its ID should equal to 3.
  expect(model1.plates[1].id).toEqual(3);

  // Immediately merge two plates again.
  model1.mergePlates(model1.plates[0], model1.plates[1]);

  // Plate division and merge involves some random() calls. Save the current seedrandom state.
  const randState = seedrandom.getState();
  const testRandNumber = seedrandom.random();

  // 50 steps so we get to some interesting state and make possible divergence / errors visible.
  const steps = 50;
  for (let i = 0; i < steps; i++) {
    model1.step(TIMESTEP);
  }

  const model2 = new Model(modelImgData, initFunc);

  // Restore seed random state saved above.
  seedrandom.initializeFromState(randState);
  // Check if it worked as expected.
  expect(seedrandom.random()).toEqual(testRandNumber);

  for (let i = 0; i < steps; i++) {
    model2.step(TIMESTEP);
  }

  compareModels(model2, model1);
});
