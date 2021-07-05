import Model from "../../js/plates-model/model";
import config from "../../js/config";
import presets from "../../js/presets";

// Increase this paramter so it uses to real-world value (setup-tests.js sets a tiny value for performance reasons).
config.voronoiSphereFieldsCount = 200000;

let modelImgData: ImageData | null = null;

beforeAll(done => {
  (self as any).getModelImage("../public/" + presets.subduction.img, (imgData: ImageData) => {
    modelImgData = imgData;
    done();
  });
});

test("subudction model is loaded correctly", () => {
  const model = new Model(modelImgData, presets.subduction.init!);
  expect(model.plates.length).toEqual(2);

  console.log(model.getPlate(0)?.fields.get(1318)?.crustThickness);
  console.log(model.getPlate(0)?.fields.get(1318)?.crust.rockLayers);

  // expect(model.getPlate(0)?.fields.get(1318)?.elevation).toBeCloseTo(0.025);
  // expect(model.getPlate(1)?.fields.get(1066)?.elevation).toBeCloseTo(0.3660);
  // expect(model.getPlate(1)?.fields.get(821)?.elevation).toBeCloseTo(0.5490);
});
