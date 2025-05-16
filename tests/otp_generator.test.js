// tests/otp_generator.test.js
const { generate_otp } = require('../src/modules/otp/otp_generator');

describe('OTP Generation', () => {
  test('should generate a default 6-digit OTP', () => {
    const otp = generate_otp();
    
    // Assert the OTP is a string with length 6
    expect(typeof otp).toBe('string');
    expect(otp).toHaveLength(6);
    
    // Optionally, verify that OTP contains only numbers
    const numericOTP = parseInt(otp, 10);
    expect(Number.isNaN(numericOTP)).toBe(false);
  });

  test('should generate OTP with a custom length', () => {
    const length = 8;
    const otp = generate_otp(length);
    
    expect(typeof otp).toBe('string');
    expect(otp).toHaveLength(length);
  });
});
