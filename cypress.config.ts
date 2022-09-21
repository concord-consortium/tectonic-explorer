import { defineConfig } from 'cypress';
import installLogsPrinter from "cypress-terminal-report/src/installLogsPrinter";

export default defineConfig({
  video: false,
  defaultCommandTimeout: 60000,
  viewportWidth: 1000,
  viewportHeight: 600,
  chromeWebSecurity: false,
  projectId: 'djeqwg',
  numTestsKeptInMemory: 10,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      installLogsPrinter(on, {
        printLogsToConsole: "always",
        // includeSuccessfulHookLogs: true,
      });
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    testIsolation: 'strict',
  },
});
