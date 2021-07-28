import Model from "../../../../js/plates-model/model";
import presets from "../../../../js/presets";
import * as modelHelper from "../../../../js/plates-model/model-test-helpers";
import { getImageData } from "../../../../js/utils";

let modelImgData = null;

before(done => {
  getImageData("/" + presets.divergentBoundary.img, (imgData) => {
    modelImgData = imgData;
    done();
  });
});

const delta = 0.01;
let model = undefined;
let rockLayers = undefined;

describe("Divergent Boundary model", () => {

  it("checks initial loading of the divergent boundary model", () => {

    model = new Model(modelImgData, presets.divergentBoundary.init);

    // Left plate - continent
    expect(modelHelper.getFieldElevation(model, 0, 2108)).to.be.closeTo(0.97, delta);
    expect(modelHelper.getFieldElevation(model, 0, 1123)).to.be.closeTo(0.75, delta);
    expect(modelHelper.getFieldElevation(model, 0, 1193)).to.be.closeTo(0.55, delta);

    // Right plate - continent
    expect(modelHelper.getFieldElevation(model, 1, 835)).to.be.closeTo(0.92, delta);
    expect(modelHelper.getFieldElevation(model, 1, 1029)).to.be.closeTo(0.75, delta);
    expect(modelHelper.getFieldElevation(model, 1, 1131)).to.be.closeTo(0.55, delta);
  });

  it("runs model for 200 million years", () => {
    modelHelper.runModelFor(model, 200); // million years
  });

  it("checks rock layers of right plate continental shelf at the diverged boundary", () => {

    // Check that the plates have diverged by checking the rock layers at the continental shelves
    // Right plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 2240);
    expect(rockLayers?.[0].rock).to.equal("Limestone");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 1, 1186);
    expect(rockLayers?.[0].rock).to.equal("Shale");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 1, 1091);
    expect(rockLayers?.[0].rock).to.equal("Sandstone");
    expect(rockLayers?.[1].rock).to.equal("Granite");
  });

  it("checks rock layers of left plate continental shelf at the diverged boundary", () => {

    // Check that the plates have diverged by checking the rock layers at the continental shelves
    // Left plate - continental shelf
    rockLayers = modelHelper.getFieldRockLayers(model, 0, 967);
    expect(rockLayers?.[0].rock).to.equal("Limestone");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 966);
    expect(rockLayers?.[0].rock).to.equal("Shale");
    expect(rockLayers?.[1].rock).to.equal("Granite");

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 1028);
    expect(rockLayers?.[0].rock).to.equal("Sandstone");
    expect(rockLayers?.[1].rock).to.equal("Granite");
  });

  it("checks rock layers and elevation of ocean at the divergent boundary", () => {

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 1005);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediment");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
    expect(modelHelper.getFieldElevation(model, 0, 1005)).to.be.closeTo(0.04, delta);

    rockLayers = modelHelper.getFieldRockLayers(model, 1, 1317);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediment");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
    expect(modelHelper.getFieldElevation(model, 1, 1317)).to.be.closeTo(0.04, delta);

    rockLayers = modelHelper.getFieldRockLayers(model, 0, 1512);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediment");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
    expect(modelHelper.getFieldElevation(model, 0, 1512)).to.be.closeTo(0.05, delta);
  });

  it("runs model for 250 million years more", () => {
    modelHelper.runModelFor(model, 250); // million years
  });

  it("checks subduction at the other side of the divergent boundary", () => {

    // The other side (where the boundaries converge) - volcano chain
    expect(modelHelper.getFieldElevation(model, 1, 6964)).to.be.closeTo(0.66, delta);
    // Check rock layers
    rockLayers = modelHelper.getFieldRockLayers(model, 1, 6964);
    expect(rockLayers?.[0].rock).to.equal("Andesite");
    expect(rockLayers?.[1].rock).to.equal("Diorite");
    expect(rockLayers?.[2].rock).to.equal("Basalt");
    expect(rockLayers?.[3].rock).to.equal("Gabbro");
    //Check Subduction
    expect(modelHelper.isFieldUnderneathSubducting(model, 1, 6964)).to.be.greaterThan(0);
    // Check subducting field rock layers
    rockLayers = modelHelper.getSubductingFieldRockLayers(model, 1, 6964);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediment");
    expect(rockLayers?.[1].rock).to.equal("Basalt");
    expect(rockLayers?.[2].rock).to.equal("Gabbro");
  });
});
