// tests/authController.additional.test.mjs
import { jest } from '@jest/globals';
import { AuthController } from "../src/modules/auth/auth.js";
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthController - Additional Functions', () => {
  let authController;

  beforeEach(() => {
    authController = new AuthController();

    console.log('[TEST] beforeEach: setting up controller and mocks');

    authController._checkRateLimit = jest.fn().mockResolvedValue();

    const fakeUserDoc = {
      id: 'user1',
      data: () => ({
        uid: 'user1',
        email: 'user@example.com',
        password: 'hashedPassword',
        phone: '1234567890',
        roles: ['customer']
      })
    };

    const fakeUsersSnapshot = {
      empty: false,
      docs: [fakeUserDoc]
    };

    authController.firestore = {
      collection: jest.fn((name) => {
        console.log(`[TEST] firestore.collection called with: ${name}`);
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
                  phone: '1234567890',
                  roles: ['customer']
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
                  lockedUntil: null,
                })
              }),
              set: jest.fn().mockResolvedValue(),
              update: jest.fn().mockResolvedValue(),
              delete: jest.fn().mockResolvedValue(),
            }),
          };
        } else if (name === 'temp_users') {
          return {
            doc: jest.fn().mockReturnValue({
              set: jest.fn().mockResolvedValue(),
            })
          };
        }
      }),
    };

    authController.redis = {
      setex: jest.fn().mockResolvedValue(),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue('123456'),
      del: jest.fn().mockResolvedValue(),
    };

    authController.otpService.redis = authController.redis;

    jest.spyOn(admin.auth(), 'getUserByEmail').mockRejectedValue({ code: 'auth/user-not-found' });
    jest.spyOn(admin.auth(), 'createUser').mockResolvedValue({
      uid: 'generatedUid',
      email: 'user@example.com',
      phoneNumber: null,
    });

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    jest.spyOn(jwt, 'verify').mockReturnValue({
      uid: 'user1',
      email: 'user@example.com',
      role: 'customer'
    });
  });

  afterEach(() => {
    console.log('[TEST] afterEach: clearing mocks');
    jest.clearAllMocks();
  });

  test('login: should login successfully with correct credentials', async () => {
    console.log('[TEST] START: login success');

    const tokens = await authController.login('user@example.com', 'password123', 'customer', '127.0.0.1');
    console.log('[TEST] login success: tokens received');

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');

    const decoded = jwt.decode(tokens.accessToken);
    console.log('[TEST] decoded token role:', decoded.role);

    expect(decoded.role).toBe('customer');
  });

  test('login: should fail login with incorrect credentials', async () => {
    console.log('[TEST] START: login failure case');

    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    await expect(
      authController.login('user@example.com', 'wrongpassword', 'customer', '127.0.0.1')
    ).rejects.toThrow();

    console.log('[TEST] login failure case: threw as expected');
  });

  test('refreshToken: should refresh tokens successfully', async () => {
    console.log('[TEST] START: refreshToken success');

    authController.redis.get = jest.fn().mockResolvedValue('validRefreshToken');
    console.log('[TEST] redis.get mocked');

    jest.spyOn(jwt, 'verify').mockReturnValue({
      uid: 'user1',
      email: 'user@example.com',
      role: 'customer'
    });
    console.log('[TEST] jwt.verify mocked');

    jest.spyOn(authController, '_getUserRecordById').mockResolvedValue({
      uid: 'user1',
      email: 'user@example.com',
      roles: ['customer']
    });
    console.log('[TEST] _getUserRecordById mocked');

    const tokens = await authController.refreshToken('validRefreshToken', '127.0.0.1');
    console.log('[TEST] refreshToken executed');

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');

    const decoded = jwt.decode(tokens.accessToken);
    console.log('[TEST] decoded refreshed token role:', decoded.role);

    expect(decoded.role).toBe('customer');
  });

  test('refreshToken: should fail if refresh token does not match stored value', async () => {
    console.log('[TEST] START: refreshToken mismatch');

    authController.redis.get = jest.fn().mockResolvedValue('differentToken');

    await expect(
      authController.refreshToken('validRefreshToken', '127.0.0.1')
    ).rejects.toThrow();

    console.log('[TEST] refreshToken mismatch: threw as expected');
  });

  test('logout: should logout successfully by deleting refresh token from Redis', async () => {
    console.log('[TEST] START: logout');

    const response = await authController.logout('user1', '127.0.0.1');

    console.log('[TEST] logout response:', response);

    expect(response.success).toBe(true);
    expect(response.message).toContain('Logged out successfully');
  });

});