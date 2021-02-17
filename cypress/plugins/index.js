const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin')

module.exports = (on, config) => {
  on('before:browser:launch', (browser, launchOptions)  => {
    // Note that it needs to match or exceed viewportHeight and viewportWidth values specified in cypress.json.
    if (browser.name === 'electron') {
      launchOptions.preferences.width = 1400
      launchOptions.preferences.height = 1000
    }
    return launchOptions;
  })

  addMatchImageSnapshotPlugin(on, config)
}
