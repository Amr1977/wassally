
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:5000",
    supportFile: false // Disable support file
  }
});
const { defineConfig } = require("cypress");
const createEsbuildPlugin = require("cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  e2e: {
    specPattern: "**/*.feature",
    setupNodeEvents(on, config) {
      createEsbuildPlugin(on, config);
      return config;
    },
  },
});
const { defineConfig } = require("cypress");
const createEsbuildPlugin = require("cypress-cucumber-pr
