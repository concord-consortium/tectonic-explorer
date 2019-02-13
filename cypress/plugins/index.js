const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin')

module.exports = (on, config) => {
  on('before:browser:launch', browser => {
    // Note that it needs to match or exceed viewportHeight and viewportWidth values specified in cypress.json.
    if (browser.name === 'electron') {
      return {
        width: 1400,
        height: 1000
      }
    }
  })

  addMatchImageSnapshotPlugin(on, config)
}
