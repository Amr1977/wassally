// tests/integration/registration.test.mjs
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AuthController } from '../../src/modules/auth/auth.js';

// Load test data from the YAML file.
const dataFilePath = path.join(process.cwd(), 'tests/integration/data/registration-data.yml');
const testData = yaml.load(fs.readFileSync(dataFilePath, 'utf8'));

// Optionally, you might want to wrap your integration tests in a describe block.
describe('Integration - Registration Using Actual Data', () => {
  let authController;

  beforeAll(() => {
    // Initialize AuthController with real or staging configurations.
    authController = new AuthController();
    // Optionally set any environment-specific configurations.
  });

  afterAll(async () => {
    // Clean up any data created during integration tests if needed.
  });

  // Use test.each to run each case.
  test.each(testData.cases)('$description', async ({ user, expected }) => {
    try {
      const ip = '127.0.0.1'; // Example IP; adjust if necessary.
      const result = await authController.initiateRegistration(user, ip);
      if (expected.success) {
        expect(result.success).toBe(true);
        expect(result.nextStep).toBe(expected.nextStep);
      } else {
        // If the test is expected to fail, you can catch the error.
        // This is just one way of handling negative tests.
        // If your implementation throws, then wrap the call in expect(...).rejects
        throw new Error("Expected Registration to fail but it succeeded.");
      }
    } catch (err) {
      if (!expected.success) {
        expect(err.message).toContain(expected.error);
      } else {
        throw err;
      }
    }
  }, 20000); // Optionally set a higher timeout per test case.
});