import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  defaultCommandTimeout: 30000,
  viewportWidth: 1400,
  viewportHeight: 1000,
  chromeWebSecurity: false,
  projectId: 'djeqwg',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
