// otp_verifier.js
/**
 * Verify the OTP provided by the user.
 * @param {string} input_otp - The OTP entered by the user.
 * @param {Object|null} stored_otp_obj - The stored OTP record (contains otp and expiry).
 * @returns {boolean} - Returns true if the OTP is valid and not expired; otherwise, false.
 */
function verify_otp(input_otp, stored_otp_obj) {
  if (!stored_otp_obj) {
    console.log("No OTP record found or OTP already used.");
    return false;
  }
  
  const current_time = Date.now();
  // Check if OTP has expired.
  if (current_time > stored_otp_obj.expiry) {
    console.log("OTP has expired.");
    return false;
  }
  
  // Check if the provided OTP matches the stored one.
  return stored_otp_obj.otp === input_otp;
}

module.exports = { verify_otp };