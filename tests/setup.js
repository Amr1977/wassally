import { jest } from '@jest/globals';

// Global mocks
jest.mock('../src/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));
