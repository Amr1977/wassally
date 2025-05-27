// tests/otpService.test.mjs
import { jest } from '@jest/globals';
import { OTPService } from "../src/modules/auth/auth.js";

describe('OTPService', () => {
  let otpService;
  let redisStub, firestoreStub;
  
  beforeEach(() => {
    otpService = new OTPService();
    
    // Stub redis methods.
    redisStub = {
      setex: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue('123456'),
      del: jest.fn().mockResolvedValue(),
    };
    
    // Stub Firestore methods.
    firestoreStub = {
      collection: jest.fn(() => firestoreStub),
      doc: jest.fn(() => firestoreStub),
      set: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          email: 'user@example.com',
          otp_attempts: 0,
          lockedUntil: null,
        }),
      }),
      update: jest.fn().mockResolvedValue(),
      delete: jest.fn().mockResolvedValue(),
    };
    
    otpService.redis = redisStub;
    otpService.firestore = firestoreStub;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should generate an OTP and store it in Redis and Firestore', async () => {
    const otp = await otpService.generateOtp('testUser', 'user@example.com');
    expect(typeof otp).toBe('string');
    expect(redisStub.setex).toHaveBeenCalledTimes(1);
    expect(firestoreStub.set).toHaveBeenCalledTimes(1);
  });
  
  test('should verify OTP when provided OTP matches stored one', async () => {
    const result = await otpService.verifyEmailOtp('testUser', '123456');
    expect(result).toBe(true);
  });
  
  test('should fail OTP verification when provided OTP does not match', async () => {
    redisStub.get.mockResolvedValue('654321');
    const result = await otpService.verifyEmailOtp('testUser', '123456');
    expect(result).toBe(false);
  });
});