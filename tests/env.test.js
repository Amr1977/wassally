// tests/env.test.mjs
import { jest } from '@jest/globals';

describe('Environment Variable Checks', () => {
  let originalEnv;
  beforeEach(() => {
    // Backup process.env to restore later.
    originalEnv = { ...process.env };
    jest.resetModules(); // Reset module cache to force re‑evaluation of auth.js
  });
  afterEach(() => {
    // Restore original environment variables after each test.
    process.env = originalEnv;
  });
  
  test('should throw an error if a required environment variable is missing', async () => {
    // Remove a required variable.
    delete process.env.GMAIL_EMAIL;
    
    // Dynamic import so that the IIFE in auth.js re‑runs.
    await expect(import("../src/modules/auth/auth.js")).rejects.toThrow(/GMAIL_EMAIL/);
  });
});