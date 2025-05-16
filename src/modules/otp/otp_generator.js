// otp_generator.js
const crypto = require('crypto');

/**
 * Generate a numeric OTP with a specified length.
 * @param {number} length - Number of digits in the OTP.
 * @returns {string} - Generated OTP as a string.
 */
function generate_otp(length = 6) {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
}

module.exports = { generate_otp };