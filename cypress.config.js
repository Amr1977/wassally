const { defineConfig } = require("cypress");
const createEsbuildPlugin = require("cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5000",
    specPattern: "**/*.feature",
    supportFile: false, // Disable support file
    setupNodeEvents(on, config) {
      // Implement event listeners
      createEsbuildPlugin(on, config);
      return config;
    },
  },
});