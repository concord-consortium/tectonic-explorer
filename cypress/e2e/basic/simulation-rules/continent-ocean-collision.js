import Model from "../../../../js/plates-model/model";
import presets from "../../../../js/presets";
import * as modelHelper from "../../../../js/plates-model/model-test-helpers";
import { getImageData } from "../../../../js/utils";

let modelImgData = null;

before(done => {
  getImageData("/" + presets.continentOceanCollision.img, (imgData) => {
    modelImgData = imgData;
    done();
  });
});

const delta = 0.01;
let model = undefined;
let rockLayers = undefined;

describe.skip("Continent Ocean Collision model", () => {

  it("sets initial loading of the continent-ocean collision model correctly", () => {

    model = new Model(modelImgData, presets.continentOceanCollision.init);

    // Left plate - continent, ocean
    expect(modelHelper.getFieldElevation(model, 0, 2773)).to.be.closeTo(0.55, delta);
    expect(modelHelper.getFieldElevation(model, 0, 2458)).to.be.closeTo(0.03, delta);

    // Right plate - ocean
    expect(modelHelper.getFieldElevation(model, 1, 967)).to.be.closeTo(0.03, delta);
  });

  it("sets rock layers of left plate at the convergent boundary correctly", () => {

    // Check that the plates have diverged by checking the rock layers at the continental shelves
    // Right plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2458);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
    expect(rockLayers?.[0].thickness).to.be.closeTo (0.05, delta);

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2773);
    expect(rockLayers?.[0].rock).to.equal("Sandstone");
    expect(rockLayers?.[1].rock).to.equal("Granite");
  });

  it("sets rock layers of right plate at the convergent boundary correctly", () => {

    // Check that the plates have diverged by checking the rock layers at the continental shelves
    // Right plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 967);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
  });

  it("sets rock layers of left plate at the convergent boundary correctly after 50 million years", () => {

    // Runs model for 50 million years
    modelHelper.runModelFor(model, 50); // million years

    // Check that the plates have diverged by checking the rock layers at the continental shelves
    // Right plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2458);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
  });

  it("sets subduction of left plate of the convergent boundary correctly", () => {

    //Check Subduction
    expect(modelHelper.isFieldUnderneathSubducting(model, 1, 967)).to.equal(true);
    // Check subducting field rock layers
    rockLayers = modelHelper.getSubductingFieldRockLayers(model, 1, 967);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
  });

  it("sets accumulation of oceanic sediment on the continental shelf at the convergent boundary correctly after 50 million years more", () => {

    // Runs model for 50 million years
    modelHelper.runModelFor(model, 50); // million years

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 2773);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediments");
    expect(rockLayers?.[1].rock).to.equal("Sandstone");
    expect(rockLayers?.[2].rock).to.equal("Granite");
    expect(rockLayers?.[0].thickness).to.be.greaterThan(0.03, delta);
  });
});
