import Model from "../../../../js/plates-model/model";
import presets from "../../../../js/presets";
import { getFieldElevation, getFieldRockLayers, runModelFor } from "../../../../js/plates-model/model-test-helpers";
import { getImageData } from "../../../../js/utils";

let modelImgData = null;

before(done => {
  getImageData("/" + presets.subduction.img, (imgData) => {
    modelImgData = imgData;
    done();
  });
});

const delta = 0.01;

describe("Subduction model", () => {
  it("loads correctly and volcanoes show up on the top plate", () => {
    const model = new Model(modelImgData, presets.subduction.init);
    
    // Left plate - ocean.
    expect(getFieldElevation(model, 0, 1318)).to.be.closeTo(0.025, delta);
    // Right plate - continental shelf.
    expect(getFieldElevation(model, 1, 1066)).to.be.closeTo(0.36, delta);
    // Right plate - continent.
    expect(getFieldElevation(model, 1, 821)).to.be.closeTo(0.54, delta);

    runModelFor(model, 100); // million years

    // Right plate - volcano.
    expect(getFieldElevation(model, 1, 1203)).to.be.greaterThan(0.7);
    const rockLayers = getFieldRockLayers(model, 1, 1203);
    // Volcanic rock (Rhyolite) should be the top-most one.
    expect(rockLayers?.[0].rock).to.equal("Rhyolite");
  });
});
