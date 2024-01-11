import config from "../src/config";
import { initialize } from "../src/seedrandom";
import path from "path";
import getPixels from "get-pixels";
import { configure } from "@testing-library/react";

// Cypress tests depend on data-test attribute already, so let's reuse it in Jest tests (React Testing library).
configure({ testIdAttribute: "data-test" });

// Make model initialization way faster. Note that it will make collision detection really inaccurate.
// If model for some reasons needs accuracy, it should set this value manually.
config.voronoiSphereFieldsCount = 1000;

// Initialize seedrandom module.
initialize(true);

const originalConfig = { ...config };
global.resetConfig = () => {
  // Restore config as it can be modified by tests.
  Object.assign(config, originalConfig);
  Object.keys(config).forEach(key => {
    if (originalConfig[key] === undefined) {
      delete config[key];
    }
  });
};

// Helper function that returns test model image data.
global.getModelImage = (file = "testModel.png", done) => {
  getPixels(path.join(__dirname, file), (err, pixels) => {
    if (err) {
      throw new Error("getModelImage failed: ", file);
    }
    done({
      data: pixels.data,
      width: pixels.shape[0],
      height: pixels.shape[1]
    });
  });
};
