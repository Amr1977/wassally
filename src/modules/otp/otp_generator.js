// src/modules/otp/otp_generator.js
import crypto from 'crypto';

/**
 * Generate a numeric OTP with a specified length.
 * @param {number} length - Number of digits in the OTP.
 * @returns {string} - Generated OTP as a string.
 */
export function generate_otp(length = 6) {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
}

// Alternative: You could also use named exports at the end if preferred
// export { generate_otp };