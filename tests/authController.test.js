// tests/authController.test.mjs
import { jest } from '@jest/globals';
import { AuthController } from "../src/modules/auth/auth.js";
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

describe('AuthController', () => {
  let authController;
  let otpGenerateMock, emailSendMock;
  
  beforeEach(() => {
    authController = new AuthController();
    
    // Stub rate limiting so it always passes.
    authController._checkRateLimit = jest.fn().mockResolvedValue();
    
    // Stub OTP generation and email sending.
    otpGenerateMock = jest.spyOn(authController.otpService, 'generateOtp').mockResolvedValue('123456');
    emailSendMock = jest.spyOn(authController.emailService, 'sendOTP').mockResolvedValue();
    
    // Stub Firestore for different collections.
    const firestoreStub = {
      collection: jest.fn().mockImplementation((collectionName) => {
        if (collectionName === 'temp_users') {
          // Stub for temporary user document.
          const tempUserDoc = {
            id: 'tempUserId',
            set: jest.fn().mockResolvedValue(),
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                email: 'user@example.com',
                password: 'hashedPassword',
                first_name: 'John',
                last_name: 'Doe',
              }),
            }),
            delete: jest.fn().mockResolvedValue(),
          };
          return { doc: jest.fn().mockReturnValue(tempUserDoc) };
        } else if (collectionName === 'pending_verifications') {
          // Stub for pending verifications document.
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  email: 'user@example.com',
                  otp_attempts: 0,
                  lockedUntil: null,
                }),
              }),
              set: jest.fn().mockResolvedValue(),
              update: jest.fn().mockResolvedValue(),
              delete: jest.fn().mockResolvedValue(),
            }),
          };
        } else if (collectionName === 'users') {
          // Stub for permanent user document.
          return {
            doc: jest.fn().mockReturnValue({
              set: jest.fn().mockResolvedValue(),
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  uid: 'generatedUid',
                  email: 'user@example.com',
                  password: 'hashedPassword',
                  phone: '1234567890',
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };
    // Override Firestore on the AuthController.
    authController.firestore = firestoreStub;
    // And crucially, override Firestore on the OTPService as well.
    authController.otpService.firestore = firestoreStub;
    
    // Stub Redis methods.
    const redisStub = {
      setex: jest.fn().mockResolvedValue(),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue('123456'),
      del: jest.fn().mockResolvedValue(),
    };
    authController.redis = redisStub;
    // Override the OTPService's Redis client with our stub.
    authController.otpService.redis = redisStub;
    
    // Stub Firebase Admin auth methods.
    jest.spyOn(admin.auth(), 'getUserByEmail').mockRejectedValue({ code: 'auth/user-not-found' });
    jest.spyOn(admin.auth(), 'createUser').mockResolvedValue({
      uid: 'generatedUid',
      email: 'user@example.com',
      phoneNumber: null,
    });
    
    // Stub bcrypt methods.
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initiate registration successfully', async () => {
    const userData = { email: 'user@example.com', password: 'password123' };
    const ip = '127.0.0.1';
    const result = await authController.initiateRegistration(userData, ip);
    
    expect(result.success).toBe(true);
    expect(result.userId).toBe('tempUserId');
    expect(result.nextStep).toBe('verify_otp');
    expect(result.message).toBe('OTP sent to email');
  });
  
  test(
    'should verify registration successfully',
    async () => {
      const ip = '127.0.0.1';
      const result = await authController.verifyRegistration('tempUserId', '123456', 'password123', ip);
      expect(result.success).toBe(true);
      expect(result.userId).toBe('generatedUid');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    },
    15000 // Increase timeout to 15 seconds for this test.
  );
});