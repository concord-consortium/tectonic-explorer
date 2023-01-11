import Model from "../../../../js/plates-model/model";
import presets from "../../../../js/presets";
import * as modelHelper from "../../../../js/plates-model/model-test-helpers";
import { getImageData } from "../../../../js/utils";

let modelImgData = null;

before(done => {
  getImageData("/" + presets.continentalCollision2.img, (imgData) => {
    modelImgData = imgData;
    done();
  });
});

const delta = 0.01;
let model = undefined;
let rockLayers = undefined;

describe.skip("Continental Collision model", () => {

  it("sets initial loading of the continental collision model correctly", () => {

    model = new Model(modelImgData, presets.continentalCollision2.init);

    // Left plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2359);
    expect(rockLayers?.[0].rock).to.equal("Sandstone");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2328);
    expect(rockLayers?.[0].rock).to.equal("Shale");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2297);
    expect(rockLayers?.[0].rock).to.equal("Limestone");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2231);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");

    // Right plate - continent
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 2140);
    expect(rockLayers?.[0].rock).to.equal("Sandstone");
    expect(rockLayers?.[1].rock).to.equal("Granite");
  });

  it("sets rock layers of right plate continent at the convergent boundary correctly after 50 million years", () => {

    // Runs model for 50 million years
    modelHelper.runModelFor(model, 50); // million years

    // Right plate - continent
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 2138);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Sandstone");
    expect(rockLayers?.[2].rock).to.equal("Shale");
    expect(rockLayers?.[3].rock).to.equal("Limestone");
    expect(rockLayers?.[4].rock).to.equal("Granite");
    expect(modelHelper.getFieldElevation(model, 1, 2138)).to.be.closeTo(0.77, delta);
    expect(modelHelper.isFieldMetamorphic(model, 1, 2138)).to.be.greaterThan(0);
  });

  it("sets rock layers of left plate continental shelf at the convergent boundary correctly", () => {

    // Right plate - continent
    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2392);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Sandstone");
    expect(rockLayers?.[2].rock).to.equal("Shale");
    expect(rockLayers?.[3].rock).to.equal("Limestone");
    expect(modelHelper.getFieldElevation(model, 0, 2392)).to.be.closeTo(0.86, delta);
    expect(modelHelper.isFieldMetamorphic(model, 0, 2392)).to.be.greaterThan(0);
  });

  it("sets rock layers of island chain at the convergent boundary correctly after 200 million years more", () => {

    // Runs model for 200 million years
    modelHelper.runModelFor(model, 200); // million years

    // Right plate - continent
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 1426);
    expect(rockLayers?.[0].rock).to.equal("Andesite");
    expect(rockLayers?.[1].rock).to.equal("Diorite");
    expect(rockLayers?.[2].rock).to.equal("Basalt");
    expect(rockLayers?.[3].rock).to.equal("Gabbro");
    expect(modelHelper.getFieldElevation(model, 1, 1426)).to.be.greaterThan(0.5, delta);
  });
});
