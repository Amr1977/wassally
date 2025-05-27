// tests/integration/endToEndAuthFlow.test.mjs
import { AuthController } from '../../src/modules/auth/auth.js';

describe('End-to-End Authentication Flow', () => {
  let authController;
  const ip = '127.0.0.1';
  const userData = {
    email: 'e2e.test.user@example.com',
    password: 'TestPass123!',
    first_name: 'E2E',
    last_name: 'Tester'
  };
  
  // Variables to capture IDs and tokens along the way.
  let tempUserId, generatedUserId;
  let accessToken, refreshToken;
  // In a real integration, you might retrieve the OTP from your inbox or a staging endpoint.
  // For test purposes, assume a predictable OTP value.
  const expectedOtp = '123456';

  beforeAll(() => {
    // Initialize your AuthController with staging configuration.
    // Make sure your staging credentials have been loaded into process.env.
    authController = new AuthController();
  });

  afterAll(async () => {
    // Optionally, clean up any test data created in Firestore or other services.
    // This ensures tests do not pollute your staging environment.
  });

  test('should successfully complete registration, login, logout, and re-login', async () => {
    // ----- Registration Initiation -----
    const regResponse = await authController.initiateRegistration(userData, ip);
    expect(regResponse.success).toBe(true);
    expect(regResponse.nextStep).toBe('verify_otp');
    tempUserId = regResponse.userId;
    
    // ----- OTP Verification (Complete Registration) -----
    // In a full integration, you might pull the OTP from an email or Redis store.
    // Here, we assume that the OTP generated is known (for example, "123456").
    const verifyResponse = await authController.verifyRegistration(
      tempUserId,
      expectedOtp,
      userData.password,
      ip
    );
    expect(verifyResponse.success).toBe(true);
    expect(verifyResponse.userId).toBeDefined();
    expect(verifyResponse.accessToken).toBeDefined();
    expect(verifyResponse.refreshToken).toBeDefined();
    generatedUserId = verifyResponse.userId;
    accessToken = verifyResponse.accessToken;
    refreshToken = verifyResponse.refreshToken;
    
    // ----- Login -----
    const loginResponse = await authController.login(userData.email, userData.password, ip);
    expect(loginResponse.accessToken).toBeDefined();
    expect(loginResponse.refreshToken).toBeDefined();

    // ----- Logout -----
    const logoutResponse = await authController.logout(generatedUserId, ip);
    expect(logoutResponse.success).toBe(true);

    // ----- Re-Login -----
    const reLoginResponse = await authController.login(userData.email, userData.password, ip);
    expect(reLoginResponse.accessToken).toBeDefined();
    expect(reLoginResponse.refreshToken).toBeDefined();
  }, 30000); // Increase timeout as needed for E2E integration tests
});