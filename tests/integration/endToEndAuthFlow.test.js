// tests/integration/endToEndAuthFlow.test.mjs

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AuthController } from '../../src/modules/auth/auth.js';

// Load YAML test data.
const testDataPath = path.join(process.cwd(), 'tests/integration/data/e2e-auth-data.yml');
const { cases: e2eCases } = yaml.load(fs.readFileSync(testDataPath, 'utf8'));

describe('End-to-End Authentication Flow (Data Driven)', () => {
  let authController;
  const ip = '127.0.0.1';

  beforeAll(() => {
    // Initialize your AuthController (ideally, staging configuration is loaded via environment vars)
    authController = new AuthController();
  });

  afterAll(async () => {
    // Optionally add cleanup operations to remove test data from Firestore or Redis.
  });

  // Iterate over test cases defined in the YAML file.
  test.each(e2eCases)(
    '$description',
    async ({ user, expectedOtp, expected }) => {
      let tempUserId, generatedUserId;
      let accessToken, refreshToken;

      // ----- Registration Initiation -----
      try {
        const regResponse = await authController.initiateRegistration(user, ip);
        expect(regResponse.success).toBe(expected.registration.success);
        if (!expected.registration.success) {
          // If registration is expected to fail, check that an error is thrown.
          throw new Error('Registration did not fail as expected.');
        }
        expect(regResponse.nextStep).toBe(expected.registration.nextStep);
        tempUserId = regResponse.userId;
      } catch (err) {
        if (!expected.registration.success) {
          expect(err.message).toContain(expected.registration.error);
          // End this test case as the failure was expected.
          return;
        }
        throw err;
      }

      // ----- OTP Verification -----
      try {
        const verifyResponse = await authController.verifyRegistration(
          tempUserId,
          expectedOtp,
          user.password,
          ip
        );
        expect(verifyResponse.success).toBe(expected.verification.success);
        if (!expected.verification.success) return;
        generatedUserId = verifyResponse.userId;
        accessToken = verifyResponse.accessToken;
        refreshToken = verifyResponse.refreshToken;
        expect(generatedUserId).toBeDefined();
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
      } catch (err) {
        if (!expected.verification.success) {
          expect(err.message).toContain(expected.verification.error);
          return;
        }
        throw err;
      }

      // ----- Login -----
      try {
        const loginResponse = await authController.login(user.email, user.password, ip);
        expect(loginResponse.accessToken).toBeDefined();
        expect(loginResponse.refreshToken).toBeDefined();
      } catch (err) {
        throw err;
      }

      // ----- Logout -----
      try {
        const logoutResponse = await authController.logout(generatedUserId, ip);
        expect(logoutResponse.success).toBe(expected.logout.success);
      } catch (err) {
        throw err;
      }

      // ----- Re-Login -----
      try {
        const reLoginResponse = await authController.login(user.email, user.password, ip);
        expect(reLoginResponse.accessToken).toBeDefined();
        expect(reLoginResponse.refreshToken).toBeDefined();
      } catch (err) {
        throw err;
      }
    },
    60000 // Increase the timeout for full end-to-end flows as needed.
  );
});