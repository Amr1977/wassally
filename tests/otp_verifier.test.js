// tests/otp_verifier.test.js
const { verify_otp } = require('../src/modules/otp/otp_verifier');

describe('OTP Verification Module', () => {
  test('should verify a valid OTP', () => {
    // Set expiry 60 seconds into the future
    const record = { otp: '987654', expiry: Date.now() + 60000 };
    const result = verify_otp('987654', record);
    expect(result).toBe(true);
  });

  test('should reject an incorrect OTP', () => {
    const record = { otp: '987654', expiry: Date.now() + 60000 };
    const result = verify_otp('123456', record);
    expect(result).toBe(false);
  });

  test('should reject an expired OTP', () => {
    // Expired OTP: expiry time in the past
    const record = { otp: '987654', expiry: Date.now() - 1000 };
    const result = verify_otp('987654', record);
    expect(result).toBe(false);
  });
});