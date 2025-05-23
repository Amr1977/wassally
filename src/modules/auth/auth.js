/**
 * @file auth.js
 * @description Manages authentication and authorization.
 */

const express = require('express');
const body_parser = require('body-parser');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// ------------------------
// Logger Module (Stub)
// ------------------------
const logger = {
  log_auth_event: (event_name, user_id, details) => {
    console.log(`[LOG] ${new Date().toISOString()} EVENT: ${event_name} | User: ${user_id}`, details);
    // In production, replace this with your dedicated logger module.
  }
};

// ------------------------
// OTP Service (In-Memory Stub)
// ------------------------
const otp_store = {};

const otp_service = {
  generate_otp: (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otp_store[email] = { otp, timestamp: Date.now() };
    return otp;
  },
  verify_otp: (email, otp) => {
    if (otp_store[email]) {
      const time_diff = Date.now() - otp_store[email].timestamp;
      // OTP valid for 5 minutes
      if (time_diff > 5 * 60 * 1000) {
        delete otp_store[email];
        return false;
      }
      if (otp_store[email].otp === otp) {
        delete otp_store[email];
        return true;
      }
    }
    return false;
  }
};

// ------------------------
// External OTP Email Service Integration
// ------------------------
async function send_mail_otp(email, otp) {
  try {
    // Set this environment variable to your Vercel endpoint for sendMailOTP.
    const send_mail_otp_endpoint = process.env.SEND_MAIL_OTP_ENDPOINT;
    const response = await axios.post(send_mail_otp_endpoint, { email, otp });
    return response.data;
  } catch (err) {
    throw new Error('Failed to send OTP mail: ' + err.message);
  }
}

// ------------------------
// Initialize Firebase Admin SDK
// ------------------------
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// ------------------------
// Express App and Middleware
// ------------------------
const app = express();
app.use(body_parser.json());

// ------------------------
// JWT Configuration
// ------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refreshsecret';
const access_token_expiry = '15m';
const refresh_token_expiry = '7d';

// ------------------------
// API Endpoints
// ------------------------

// 1. Registration Endpoint
app.post('/auth/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Create user via Firebase Admin
    const user_record = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: `${first_name} ${last_name}`
    });

    logger.log_auth_event('user_registered', user_record.uid, { email });

    // Initiate OTP verification for added security
    const otp = otp_service.generate_otp(email);

    // Use the external sendMailOTP service to send OTP via email
    await send_mail_otp(email, otp);
    logger.log_auth_event('otp_sent', email, { otp });

    return res.status(201).json({
      message: "User registered successfully. Please verify OTP.",
      uid: user_record.uid
    });
  } catch (err) {
    logger.log_auth_event('register_error', email, { error: err.message });
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

// 2. OTP Request Endpoint
app.post('/auth/otp/request', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required for OTP request." });
  }

  try {
    // Ensure the user exists before sending OTP.
    await admin.auth().getUserByEmail(email);
    const otp = otp_service.generate_otp(email);

    // Use external sendMailOTP service to deliver the OTP.
    await send_mail_otp(email, otp);
    logger.log_auth_event('otp_sent', email, { otp });

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (err) {
    return res.status(404).json({ message: "User not found or error in sending OTP.", error: err.message });
  }
});

// 3. OTP Verification Endpoint
app.post('/auth/otp/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  if (otp_service.verify_otp(email, otp)) {
    logger.log_auth_event('otp_verified', email, {});
    return res.status(200).json({ message: "OTP verified successfully." });
  } else {
    logger.log_auth_event('otp_verification_failed', email, {});
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }
});

// 4. Login & Session Management Endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password, otp } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Retrieve user using Firebase Admin.
    const user_record = await admin.auth().getUserByEmail(email);
    if (!user_record)
      return res.status(401).json({ message: "Authentication failed." });

    // Require OTP validation for added security.
    if (!otp || !otp_service.verify_otp(email, otp)) {
      logger.log_auth_event('login_failed', email, { reason: 'OTP missing or invalid.' });
      return res.status(400).json({ message: "OTP required or invalid." });
    }

    // Generate a Firebase custom token (useful for client-side Firebase sign-in)
    const custom_token = await admin.auth().createCustomToken(user_record.uid);

    // Generate JWT tokens for session management
    const access_token = jwt.sign({ uid: user_record.uid, email }, JWT_SECRET, { expiresIn: access_token_expiry });
    const refresh_token = jwt.sign({ uid: user_record.uid, email }, REFRESH_SECRET, { expiresIn: refresh_token_expiry });

    logger.log_auth_event('login_success', email, {});
    return res.status(200).json({ access_token, refresh_token, custom_token });
  } catch (err) {
    logger.log_auth_event('login_error', email, { error: err.message });
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// 5. Token Refresh Endpoint
app.post('/auth/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh token is required." });
  }
  try {
    const payload = jwt.verify(refresh_token, REFRESH_SECRET);
    const new_access_token = jwt.sign({ uid: payload.uid, email: payload.email }, JWT_SECRET, { expiresIn: access_token_expiry });
    logger.log_auth_event('token_refreshed', payload.email, {});
    return res.status(200).json({ access_token: new_access_token });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token.", error: err.message });
  }
});

// 6. Logout Endpoint
app.post('/auth/logout', (req, res) => {
  const { email } = req.body;
  logger.log_auth_event('logout', email || 'unknown', {});
  return res.status(200).json({ message: "Logged out successfully." });
});

// 7. Password Reset Initiation Endpoint
app.post('/auth/password/reset/initiate', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  try {
    const user_record = await admin.auth().getUserByEmail(email);
    if (!user_record)
      return res.status(404).json({ message: "User not found." });
    // Generate a password reset token with JWT.
    const reset_token = jwt.sign({ uid: user_record.uid, email }, JWT_SECRET, { expiresIn: '1h' });
    logger.log_auth_event('password_reset_initiated', email, { reset_token });
    return res.status(200).json({ message: "Password reset initiated. Check your email.", reset_token });
  } catch (err) {
    logger.log_auth_event('password_reset_error', email, { error: err.message });
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// 8. Password Reset Confirmation Endpoint
app.post('/auth/password/reset/confirm', async (req, res) => {
  const { reset_token, new_password } = req.body;
  if (!reset_token || !new_password) {
    return res.status(400).json({ message: "Reset token and new password are required." });
  }
  try {
    const payload = jwt.verify(reset_token, JWT_SECRET);
    await admin.auth().updateUser(payload.uid, { password: new_password });
    logger.log_auth_event('password_reset_success', payload.email, {});
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    logger.log_auth_event('password_reset_failed', 'unknown', { error: err.message });
    return res.status(400).json({ message: "Password reset failed.", error: err.message });
  }
});

// 9. Profile Endpoint
app.get('/auth/profile', async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user_record = await admin.auth().getUser(payload.uid);
    logger.log_auth_event('profile_fetched', payload.email, {});
    return res.status(200).json({ user: user_record });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token.", error: err.message });
  }
});

// ------------------------
// Start the Server
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authentication Module Server is running on port ${PORT}`);
});