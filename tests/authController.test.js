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
    
    // Stub Firestore for temp_users.
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
    const firestoreStub = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(tempUserDoc),
      }),
    };
    authController.firestore = firestoreStub;
    
    // Stub Redis.
    authController.redis = {
      setex: jest.fn().mockResolvedValue(),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(),
    };
    
    // Stub admin.auth().getUserByEmail to simulate "user not found".
    jest.spyOn(admin.auth(), 'getUserByEmail').mockRejectedValue({ code: 'auth/user-not-found' });
    
    // Stub bcrypt hashing/comparison.
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    
    // Stub admin.auth().createUser.
    jest.spyOn(admin.auth(), 'createUser').mockResolvedValue({
      uid: 'generatedUid',
      email: 'user@example.com',
      phoneNumber: null,
    });
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
  
  test('should verify registration successfully', async () => {
    const ip = '127.0.0.1';
    const result = await authController.verifyRegistration('tempUserId', '123456', 'password123', ip);
    expect(result.success).toBe(true);
    expect(result.userId).toBe('generatedUid');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});