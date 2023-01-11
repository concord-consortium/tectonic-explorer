const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin");

module.exports = (on, config) => {
  on("before:browser:launch", (browser, launchOptions)  => {
    // Note that it needs to match or exceed viewportHeight and viewportWidth values specified in cypress.json.
    if (browser.name === "chrome" && process.env.CYPRESS_COMPARE_SNAPSHOTS) {
      // If you want to use headed Chrome to compare screenshots, this is necessary. But it'll make Chrome a bit blurry
      // on HDPI displays. Also, note that your test Chrome window should have dimensions bigger than 1400x1000.
      // It's strange / a Cypress bug, but otherwise the screenshot dimensions will be affected.
      launchOptions.args.push("--force-device-scale-factor=1");
    }
    if (browser.name === "electron") {
      launchOptions.preferences.width = 1400;
      launchOptions.preferences.height = 1000;
    }
    return launchOptions;
  });

  addMatchImageSnapshotPlugin(on, config);
};
