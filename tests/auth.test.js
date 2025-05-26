// tests/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../src/modules/auth/auth.js';
import { Firestore } from '@google-cloud/firestore';

// Mock Firestore
vi.mock('@google-cloud/firestore', () => {
  const Firestore = vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ status: 'pending' })
        }))
      }))
    }))
  }));

  return { 
    Firestore, 
    FieldValue: { 
      serverTimestamp: vi.fn() 
    } 
  };
});

// Mock dependencies
vi.mock('../src/modules/auth/services/otp-service.js', () => ({
  default: vi.fn(() => ({
    generateDualOTP: vi.fn(() => Promise.resolve({
      emailOtp: '123456'
    }))
  }))
}));

vi.mock('../src/modules/auth/services/email-service.js', () => ({
  default: vi.fn(() => ({
    sendOTP: vi.fn(() => Promise.resolve())
  }))
}));

describe('AuthController', () => {
  let authController;
  const testUser = {
    email: 'test@example.com',
    phone