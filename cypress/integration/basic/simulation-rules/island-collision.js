import Model from "../../../../js/plates-model/model";
import presets from "../../../../js/presets";
import { getFieldElevation, getFieldRockLayers, runModelFor } from "../../../../js/plates-model/model-test-helpers";
import { getImageData } from "../../../../js/utils";

let modelImgData = null;

before(done => {
  getImageData("/" + presets.islandCollision.img, (imgData) => {
    modelImgData = imgData;
    done();
  });
});

const delta = 0.01;

describe("Island Collision 2 model", () => {
  it("loads correctly and after some time the small islands are scraped and added to the top plate", () => {
    const model = new Model(modelImgData, presets.islandCollision.init);
    
    // Left plate - island.
    expect(getFieldElevation(model, 0, 2428)).to.be.closeTo(0.67, delta);
    // Right plate - continental shelf.
    expect(getFieldElevation(model, 1, 998)).to.be.closeTo(0.33, delta);

    runModelFor(model, 100); // million years

    // Right plate - continental shelf with islands leftovers (oceanic volcanic rocks).
    expect(getFieldElevation(model, 1, 998)).to.be.greaterThan(0.80);
    const rockLayers = getFieldRockLayers(model, 1, 998);
    expect(rockLayers?.[0].rock).to.equal("Oceanic Sediment");
    expect(rockLayers?.[1].rock).to.equal("Andesite");
    expect(rockLayers?.[2].rock).to.equal("Diorite");

    // Left plate - island scraped and subducting.
    expect(getFieldElevation(model, 0, 2428)).to.be.lessThan(0);
  });
});
