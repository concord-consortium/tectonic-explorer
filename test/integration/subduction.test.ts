import Model from "../../js/plates-model/model";
import config from "../../js/config";
import presets from "../../js/presets";
import { getFieldElevation, getFieldRockLayers, runModelFor } from "../../js/plates-model/model-test-helpers";

// Increase this parameter so it uses to real-world value (setup-tests.js sets a tiny value for performance reasons).
config.voronoiSphereFieldsCount = 200000;

let modelImgData: ImageData | null = null;

beforeAll(done => {
  (self as any).getModelImage("../public/" + presets.subduction.img, (imgData: ImageData) => {
    modelImgData = imgData;
    done();
  });
});

test("subduction model is loaded correctly and volcanoes show up on the top plate", () => {
  const model = new Model(modelImgData, presets.subduction.init!);
  expect(model.plates.length).toEqual(2);

  // Left plate - ocean.
  expect(getFieldElevation(model, 0, 1318)).toBeCloseTo(0.025);
  // Right plate - continental shelf.
  expect(getFieldElevation(model, 1, 1066)).toBeCloseTo(0.3660);
  // Right plate - continent.
  expect(getFieldElevation(model, 1, 821)).toBeCloseTo(0.5490);

  runModelFor(model, 20);

  // Right plate - volcano.
  expect(getFieldElevation(model, 1, 1103)).toBeGreaterThan(0.8);
  const rockLayers = getFieldRockLayers(model, 1, 1103);
  // Volcanic rock (Rhyolite) should be the top-most one.
  expect(rockLayers?.[0].rock).toEqual("Rhyolite");
});
