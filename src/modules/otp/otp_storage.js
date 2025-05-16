// otp_storage.js
const otp_store = {};

/**
 * Save an OTP for a given email with an expiry time.
 * @param {string} email - The user's email.
 * @param {string} otp - The generated OTP.
 * @param {number} expiry_duration - Duration in seconds until the OTP expires.
 */
async function save_otp(email, otp, expiry_duration) {
  const expiry_timestamp = Date.now() + expiry_duration * 1000; // Convert seconds to ms
  otp_store[email] = { otp, expiry: expiry_timestamp };
}

/**
 * Retrieve the OTP record for a given email.
 * @param {string} email
 * @returns {Object|null} - OTP record containing `otp` and `expiry`, or null if not found.
 */
async function get_otp(email) {
  return otp_store[email] || null;
}

/**
 * Delete OTP after successful verification to prevent reuse.
 * @param {string} email
 */
async function delete_otp(email) {
  delete otp_store[email];
}

module.exports = { save_otp, get_otp, delete_otp };