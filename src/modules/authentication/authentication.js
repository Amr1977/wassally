// authentication.js
import firebase from "firebase/app";
import "firebase/auth";

/**
 * Sign up a new user using phone authentication.
 * Returns a confirmation object used for OTP verification.
 */
export async function signUpWithPhone(phoneNumber) {
  const appVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button');
  try {
    const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error signing up with phone number:", error);
    throw error;
  }
}

/**
 * Verify the OTP code using the confirmationResult from signUpWithPhone.
 */
export async function verifyOTP(confirmationResult, otpCode) {
  try {
    const userCredential = await confirmationResult.confirm(otpCode);
    return userCredential;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
}

/**
 * Log out the current user.
 */
export async function logoutUser() {
  try {
    await firebase.auth().signOut();
  } catch (error) {
    console.error("Error logging out user:", error);
    throw error;
  }
}

/**
 * (Optional) Enable additional multi-factor authentication (MFA).
 * This function can be extended to tie in with an authenticator app or email OTP.
 */
export async function enableMFA(user) {
  // Placeholder: Firebase MFA setup if required.
  if (user.multiFactor.enrolledFactors.length === 0) {
    // Implementation depends on your MFA strategy.
    console.log("MFA is not set up on this account yet.");
  }
}
