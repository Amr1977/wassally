// tests/authController.additional.test.mjs
import { jest } from '@jest/globals';
import { AuthController } from "../src/modules/auth/auth.js"; // Import our updated auth module
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthController - Additional Functions', () => {
  let authController;

  beforeEach(() => {
    // Create a new instance of AuthController
    authController = new AuthController();

    // Stub rate limiting so it always passes.
    authController._checkRateLimit = jest.fn().mockResolvedValue();

    // Stub Firestore operations with minimal fake data:
    // For "users" collection (used in login and refreshToken)
    const fakeUserDoc = {
      id: 'user1',
      data: () => ({
        uid: 'user1',
        email: 'user@example.com',
        password: 'hashedPassword', // this represents a stored hash
        phone: '1234567890'
      })
    };
    const fakeUsersSnapshot = {
      empty: false,
      docs: [fakeUserDoc]
    };

    authController.firestore = {
      collection: jest.fn((name) => {
        if (name === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(fakeUsersSnapshot)
            }),
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  uid: 'user1',
                  email: 'user@example.com',
                  password: 'hashedPassword',
                  phone: '1234567890'
                })
              })
            })
          };
        } else if (name === 'pending_verifications') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  email: 'user@example.com',
                  otp_attempts: 0,
                  lockedUntil: null
                })
              }),
              set: jest.fn().mockResolvedValue(),
              delete: jest.fn().mockResolvedValue()
            })
          };
        } else if (name === 'temp_users') {
          return {
            doc: jest.fn().mockReturnValue({
              set: jest.fn().mockResolvedValue(),
            })
          };
        }
      })
    };

    // Stub Redis with minimal functions.
    authController.redis = {
      setex: jest.fn().mockResolvedValue(),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue('dummyRefreshToken'),
      del: jest.fn().mockResolvedValue()
    };

    // Stub OTPService and EmailService used by resendOTP
    jest.spyOn(authController.otpService, 'generateOtp').mockResolvedValue('654321');
    jest.spyOn(authController.emailService, 'sendOTP').mockResolvedValue();

    // Stub bcrypt.compare for login
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    // Stub admin.auth().getUserByEmail (not used in login since we rely on Firestore queries)
    jest.spyOn(admin.auth(), 'getUserByEmail').mockRejectedValue({ code: 'auth/user-not-found' });

    // Stub jwt.verify for refreshToken: simulate a payload with uid, etc.
    jest.spyOn(jwt, 'verify').mockReturnValue({ uid: 'user1', email: 'user@example.com' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('login: should login successfully with correct credentials', async () => {
    // Call the login function using valid credentials.
    const tokens = await authController.login('user@example.com', 'password123', '127.0.0.1');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });

  test('login: should fail login with incorrect credentials', async () => {
    // Force bcrypt.compare to return false to simulate a wrong password.
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
    await expect(
      authController.login('user@example.com', 'wrongpassword', '127.0.0.1')
    ).rejects.toThrow('Login failed. Please check your credentials and try again.');
  });

  test('resendOTP: should resend OTP successfully', async () => {
    const response = await authController.resendOTP('tempId123', '127.0.0.1');
    expect(response.success).toBe(true);
    expect(response.message).toContain('A new OTP has been sent');
  });

  test('refreshToken: should refresh tokens successfully', async () => {
    // Simulate that the stored refresh token in Redis matches the provided one.
    authController.redis.get = jest.fn().mockResolvedValue('validRefreshToken');
    const tokens = await authController.refreshToken('validRefreshToken', '127.0.0.1');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });

  test('refreshToken: should fail if refresh token does not match stored value', async () => {
    // Simulate stored token mismatch.
    authController.redis.get = jest.fn().mockResolvedValue('differentToken');
    await expect(
      authController.refreshToken('validRefreshToken', '127.0.0.1')
    ).rejects.toThrow('Token refresh failed. Please log in again.');
  });

  test('logout: should logout successfully by deleting refresh token from Redis', async () => {
    const response = await authController.logout('user1', '127.0.0.1');
    expect(response.success).toBe(true);
    expect(response.message).toContain('Logged out successfully.');
  });
});