import { defineConfig } from 'cypress';
import installLogsPrinter from "cypress-terminal-report/src/installLogsPrinter";

export default defineConfig({
  video: false,
  defaultCommandTimeout: 60000,
  viewportWidth: 1400,
  viewportHeight: 1000,
  chromeWebSecurity: false,
  projectId: 'djeqwg',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      installLogsPrinter(on);
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    testIsolation: 'strict',
  },
});
