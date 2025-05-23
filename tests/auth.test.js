const request = require('supertest');
const app = require('../src/modules/auth');
const admin = require('firebase-admin');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

// Mock external services
jest.mock('firebase-admin');
jest.mock('ioredis');
jest.mock('axios');
jest.mock('./email-service'); // Assuming you've extracted email service

// Test configuration
const TEST_PORT = 5000;
const TEST_USER = {
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'securePassword123',
  firstName: 'Test',
  lastName: 'User'
};

let server;
let redisClient;

beforeAll(async () => {
  redisClient = new Redis();
  server = app.listen(TEST_PORT);
  
  // Mock Firebase admin methods
  admin.auth().getUserByEmail.mockImplementation((email) => {
    if (email === TEST_USER.email) {
      return Promise.resolve({
        uid: 'test-uid',
        email: TEST_USER.email,
        phoneNumber: TEST_USER.phone,
        emailVerified: true
      });
    }
    return Promise.reject(new Error('User not found'));
  });

  admin.auth().createUser.mockImplementation((user) => {
    return Promise.resolve({
      uid: 'new-user-uid',
      ...user
    });
  });
});

afterAll(async () => {
  await server.close();
  await redisClient.quit();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Authentication API', () => {
  describe('Registration Flow', () => {
    test('POST /auth/register/initiate - should initiate registration', async () => {
      const response = await request(app)
        .post('/auth/register/initiate')
        .send({
          email: 'new@example.com',
          phone: '+1987654321',
          password: 'newPassword123',
          first_name: 'New',
          last_name: 'User'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verificationRequired', true);
      expect(response.body).toHaveProperty('verificationId');
    });

    test('POST /auth/register/initiate - should reject existing email', async () => {
      const response = await request(app)
        .post('/auth/register/initiate')
        .send({
          email: TEST_USER.email,
          phone: TEST_USER.phone,
          password: TEST_USER.password,
          first_name: TEST_USER.firstName,
          last_name: TEST_USER.lastName
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already in use');
    });

    test('POST /auth/register/verify - should complete registration', async () => {
      // First store test data in Redis
      await redisClient.set(
        `pending:${TEST_USER.email}:${TEST_USER.phone}`,
        JSON.stringify({
          email: TEST_USER.email,
          phone: TEST_USER.phone,
          password: TEST_USER.password,
          first_name: TEST_USER.firstName,
          last_name: TEST_USER.lastName
        })
      );

      // Store test OTP
      await redisClient.set(
        `otp:email:${TEST_USER.email}`,
        JSON.stringify({
          otp: '123456',
          attempts: 0,
          createdAt: Date.now()
        })
      );

      const response = await request(app)
        .post('/auth/register/verify')
        .send({
          email: TEST_USER.email,
          phone: TEST_USER.phone,
          emailOtp: '123456',
          firebaseToken: 'mock-firebase-token'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
    });
  });

  describe('Login Flow', () => {
    test('POST /auth/login/initiate - should initiate login', async () => {
      const response = await request(app)
        .post('/auth/login/initiate')
        .send({
          phone: TEST_USER.phone,
          password: TEST_USER.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verificationRequired', true);
    });

    test('POST /auth/login/verify - should complete login', async () => {
      // Store test OTP
      await redisClient.set(
        `login:test-uid`,
        '123456'
      );

      const response = await request(app)
        .post('/auth/login/verify')
        .send({
          uid: 'test-uid',
          emailOtp: '123456',
          firebaseToken: 'mock-firebase-token'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Token Management', () => {
    let validRefreshToken;

    beforeAll(() => {
      validRefreshToken = jwt.sign(
        { uid: 'test-uid', email: TEST_USER.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      // Store valid refresh token
      redisClient.set(`refresh:test-uid`, validRefreshToken);
    });

    test('POST /auth/refresh - should refresh access token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    test('POST /auth/logout - should invalidate tokens', async () => {
      const accessToken = jwt.sign(
        { uid: 'test-uid' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: TEST_USER.email
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Password Reset', () => {
    test('POST /auth/password/reset/request - should initiate reset', async () => {
      const response = await request(app)
        .post('/auth/password/reset/request')
        .send({
          email: TEST_USER.email
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset link sent to your email');
    });

    test('POST /auth/password/reset/confirm - should complete reset', async () => {
      const resetToken = jwt.sign(
        { uid: 'test-uid', email: TEST_USER.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/auth/password/reset/confirm')
        .send({
          resetToken,
          newPassword: 'newSecurePassword123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });
  });

  describe('Error Handling', () => {
    test('Invalid routes - should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent-route');
      
      expect(response.status).toBe(404);
    });

    test('Invalid OTP - should return 400', async () => {
      // Store test OTP
      await redisClient.set(
        `login:test-uid`,
        '123456'
      );

      const response = await request(app)
        .post('/auth/login/verify')
        .send({
          uid: 'test-uid',
          emailOtp: 'wrong-otp',
          firebaseToken: 'mock-firebase-token'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });

    test('Rate limiting - should block excessive requests', async () => {
      // Mock rate limiter to trigger immediately for testing
      jest.mock('../rate-limiter', () => ({
        authLimiter: (req, res, next) => {
          res.status(429).json({ message: 'Too many requests' });
        }
      }));

      const response = await request(app)
        .post('/auth/login/initiate')
        .send({
          phone: TEST_USER.phone,
          password: TEST_USER.password
        });
      
      expect(response.status).toBe(429);
    });
  });
});
