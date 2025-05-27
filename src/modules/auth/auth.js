/*
  Auth Module - Updated Authentication Implementation
  Revised based on new requirements:
    - Removed phone SMS OTP functionality; email OTP remains.
    - Corrected nodemailer transporter configuration.
    - Extended environment variable fail-fast checks (including optional parameters).
    - Implemented exponential backoff (temporary lockout) for OTP verification.
    - Added extensive logging and audit trails for OTP attempts.
    - Enhanced input validation using Joi (a free validation library).
*/

/* ----------------------- Preliminary Security Checks & Imports ----------------------- */

(function checkEnvVariables() {
  // Required environment variables must exist for secure operation.
  const requiredEnv = [
    'GMAIL_EMAIL',
    'GMAIL_APP_PASSWORD',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
    // Removed FIREBASE_API_KEY from required list as SMS OTP is no longer used.
  ];
  // Optional parameters have default values; warn if not set.
  const optionalEnv = [
    'OTP_EXPIRY',
    'JWT_ACCESS_EXPIRY',
    'JWT_REFRESH_EXPIRY',
    'REDIS_URL'
  ];
  requiredEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable "${envVar}" is required for secure operation.`);
    }
  });
  optionalEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.warn(`Optional environment variable "${envVar}" is not set. Using default value if applicable.`);
    }
  });
})();

// ----------------------- Dependencies & Imports -----------------------

// Import necessary libraries and modules.
import nodemailer from 'nodemailer';
import Redis from 'ioredis';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import Joi from 'joi'; // Robust, free input validation library

// ----------------------- Configuration Constants -----------------------

const SALT_ROUNDS = 10; // Number of rounds for bcrypt hashing (modify if needed).

const OTP_CONFIG = {
  EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY) || 300, // OTP lifespan (5 minutes default).
  MAX_ATTEMPTS: 3,     // Maximum allowed OTP verification attempts.
  OTP_LENGTH: 6        // Length of the OTP code.
};

const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,   // Mandatory (checked above).
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,  // Mandatory (checked above).
  ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m', // Default 15 minutes.
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d', // Default 7 days.
  ISSUER: 'BadrDeliveryAuth',                      // JWT issuer claim.
  AUDIENCE: 'BadrDeliveryUsers'                    // JWT audience claim.
};

const REDIS_CONFIG = {
  URL: process.env.REDIS_URL || 'redis://localhost:6379'
};

const LOCKOUT_BASE_DURATION = 60; // Base lockout duration (in seconds) for exponential backoff.

// ----------------------- Utility: Input Validation using Joi -----------------------

/**
 * Validates user registration data using Joi.
 * Throws an error with a descriptive message if validation fails.
 *
 * @param {Object} data - User registration data.
 */
function validateUserData(data) {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address.',
      'any.required': 'Email is required.'
    }),
    // Phone is now optional since SMS OTP is removed.
    phone: Joi.string().pattern(/^\+?\d{7,15}$/).optional().messages({
      'string.pattern.base': 'Phone must be a valid phone number with 7-15 digits.'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long.',
      'any.required': 'Password is required.'
    })
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
}

// ----------------------- Email Service -----------------------

/**
 * EmailService handles sending OTP codes via email using nodemailer.
 */
export class EmailService {
  constructor() {
    // Corrected transporter configuration with proper credential usage.
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  /**
   * Sends an OTP code to the specified email address.
   *
   * @param {string} email - The recipient's email.
   * @param {string} otp - The generated OTP.
   * @returns {Promise<void>}
   */
  async sendOTP(email, otp) {
    try {
      await this.transporter.sendMail({
        from: `"Badr Delivery" <${process.env.GMAIL_EMAIL}>`,
        to: email,
        subject: 'Your OTP Code',
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });
      console.info(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Email sending failed', { error });
      throw new Error('Failed to send OTP. Please try again later.');
    }
  }
}

// ----------------------- OTP Service -----------------------

/**
 * OTPService generates and verifies OTP codes.
 * OTPs are stored in Redis and verification attempts are tracked in Firestore.
 * Implements exponential backoff (temporary lockout) for repeated failed attempts.
 */
export class OTPService {
  constructor() {
    this.redis = new Redis(REDIS_CONFIG.URL);
    this.firestore = new Firestore();
  }

  /**
   * Generates an email OTP and stores it in Redis.
   *
   * @param {string} userId - Unique user identifier.
   * @param {string} email - User's email.
   * @returns {Promise<string>} The generated email OTP.
   */
  async generateOtp(userId, email) {
    const otp = this._generateCode();
    
    // Store OTP in Redis with an expiry.
    await this.redis.setex(`otp:email:${email}`, OTP_CONFIG.EXPIRY_SECONDS, otp);
    
    // Create a pending verification record in Firestore with initial attempt count.
    await this.firestore.collection('pending_verifications').doc(userId).set({
      email,
      created_at: FieldValue.serverTimestamp(),
      otp_attempts: 0,
      lockedUntil: null
    });
    
    console.info(`Generated OTP for user ${userId} and email ${email}`);
    // Audit trail log for OTP generation.
    console.log(`Audit: OTP generated for user (${userId}, email: ${email}).`);
    return otp;
  }

/**
 * Verifies the email OTP provided by the user.
 * Implements exponential backoff for lockout if too many failed attempts.
 *
 * @param {string} userId - The user identifier.
 * @param {string} otp - The OTP provided by the user.
 * @returns {Promise<boolean>} True if verification is successful, false otherwise.
 */
async verifyEmailOtp(userId, otp) {
  try {
    console.trace("Entering verifyEmailOtp");
    
    // Fetch the pending verification document.
    const pendingDoc = await this.firestore
      .collection('pending_verifications')
      .doc(userId)
      .get();
    console.trace("Fetched pending_verifications doc", pendingDoc.exists);
    
    if (!pendingDoc.exists) {
      console.warn(`Pending verification record not found for user ${userId}`);
      return false;
    }
    
    const data = pendingDoc.data();
    const email = data.email;
    let attempts = data.otp_attempts || 0;
    let lockedUntil = data.lockedUntil;
    const now = Date.now();
    
    // Check for an ongoing lockout period.
    if (lockedUntil && now < lockedUntil) {
      console.warn(`OTP verification blocked for ${email} because of lockout until ${new Date(lockedUntil).toISOString()}`);
      return false;
    }
    
    console.trace(`Before calling redis.get() for key otp:email:${email}`);
    const storedOtp = await this.redis.get(`otp:email:${email}`);
    console.trace(`Redis returned OTP: ${storedOtp}`);
    
    // Compare the OTP.
    if (storedOtp !== otp) {
      attempts += 1;
      if (attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        const lockoutSeconds = LOCKOUT_BASE_DURATION * Math.pow(2, attempts - OTP_CONFIG.MAX_ATTEMPTS);
        lockedUntil = now + lockoutSeconds * 1000;
        console.warn(`Exceeded max attempts for ${email}. Locking out until ${new Date(lockedUntil).toISOString()}`);
      }
      console.trace("Updating pending_verifications document with attempts:", attempts, "lockedUntil:", lockedUntil);
      await this.firestore.collection('pending_verifications').doc(userId).update({
        otp_attempts: attempts,
        lockedUntil
      });
      return false;
    }
    
    console.trace("OTP verified successfully. Proceeding with cleanup.");
    // Clean up: remove OTP from Redis and delete the pending verification document.
    await Promise.all([
      this.redis.del(`otp:email:${email}`),
      this.firestore.collection('pending_verifications').doc(userId).delete()
    ]);
    console.trace("Cleanup completed, exiting verifyEmailOtp with success.");
    return true;
  } catch (err) {
    console.error("Error during verifyEmailOtp:", err);
    throw err;
  }
}

  /**
   * Cleans up OTP data stored in Redis and the pending verification record in Firestore.
   *
   * @param {string} userId - User identifier.
   * @param {string} email - User's email.
   * @returns {Promise<void>}
   */
  async _cleanupOtp(userId, email) {
    await Promise.all([
      this.redis.del(`otp:email:${email}`),
      this.firestore.collection('pending_verifications').doc(userId).delete()
    ]);
    console.info(`Cleaned up OTP data for user ${userId} and email ${email}`);
  }

  /**
   * Generates a numerical OTP with a fixed length.
   *
   * @returns {string} The numerical OTP code.
   */
  _generateCode() {
    return Math.floor(
      Math.pow(10, OTP_CONFIG.OTP_LENGTH - 1) +
      Math.random() * 9 * Math.pow(10, OTP_CONFIG.OTP_LENGTH - 1)
    ).toString();
  }
}/* ----------------------- Auth Controller ----------------------- */

/**
 * AuthController orchestrates user registration and OTP verification securely.
 * It integrates EmailService and OTPService, implements rate limiting, and logs detailed audit information.
 */
export class AuthController {
  constructor() {
    this.otpService = new OTPService();
    this.emailService = new EmailService();
    this.redis = new Redis(REDIS_CONFIG.URL); // Used for storing JWT refresh tokens & rate limiting metadata.
    this.firestore = new Firestore();
  }
  
  /**
   * Internal method to check rate limiting based on the caller's IP.
   *
   * @param {string} ip - Caller IP address.
   * @returns {Promise<void>}
   * @throws {Error} When the rate limit is exceeded.
   */
  async _checkRateLimit(ip) {
    const RATE_LIMIT = 100; // Maximum requests allowed per minute per IP.
    const RATE_LIMIT_WINDOW = 60; // Window in seconds.
    const key = `rate:${ip}`;
    const requests = await this.redis.incr(key);
    if (requests === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW);
    }
    if (requests > RATE_LIMIT) {
      console.warn(`Rate limit exceeded for IP ${ip}. Request count: ${requests}.`);
      throw new Error('Too many requests. Please try again later.');
    }
  }
  
  /**
   * Initiates registration by validating input, hashing the password,
   * creating a temporary user record, and sending an email OTP.
   *
   * @param {Object} userData - Registration data (must include email, phone, password etc.).
   * @param {string} ip - Caller IP address for rate limiting and audit logging.
   * @returns {Promise<Object>} An object detailing the next steps.
   */
  async initiateRegistration(userData, ip) {
    try {
      // Rate limiting check.
      await this._checkRateLimit(ip);
      
      // Validate input data using Joi-based validation.
      validateUserData(userData);

      // Check if the email is already registered in Firebase Auth.
      try {
        await admin.auth().getUserByEmail(userData.email);
        throw new Error('Email already in use');
      } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
      }

      // Hash the user's password using bcrypt.
      const plainPassword = userData.password;
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      userData.password = hashedPassword; // Replace plaintext with the hashed password.

      // Create a temporary user record in Firestore (temp_users collection).
      const userRef = this.firestore.collection('temp_users').doc();
      await userRef.set({
        ...userData,
        created_at: FieldValue.serverTimestamp(),
        status: 'pending_verification'
      });

      // Generate email OTP for verification.
      const emailOtp = await this.otpService.generateOtp(userRef.id, userData.email);

      // Send the email OTP.
      await this.emailService.sendOTP(userData.email, emailOtp);

      console.info(`Registration initiated for email ${userData.email} from IP ${ip}`);
      console.log(`Audit: Initiated registration for user ${userRef.id} (email: ${userData.email}, IP: ${ip}).`);

      return {
        success: true,
        userId: userRef.id,
        nextStep: 'verify_otp',
        message: 'OTP sent to email'
      };
    } catch (error) {
      console.error(`Registration failed for IP ${ip}: ${error.message}`);
      throw new Error('Registration failed. Please try again.');
    }
  }

/**
 * Verifies the OTP and the user's password.
 * On success, creates a Firebase user record, stores their profile,
 * and generates JWT tokens.
 *
 * @param {string} userId - The temporary user ID.
 * @param {string} emailOtp - OTP sent via email.
 * @param {string} plainPassword - The user's plaintext password (re-entered).
 * @param {string} ip - Caller IP address for rate limiting and audit logging.
 * @returns {Promise<Object>} An object containing tokens and the new user ID.
 */
async verifyRegistration(userId, emailOtp, plainPassword, ip) {
  try {
    console.trace("Entering verifyRegistration");

    // Rate limiting check.
    await this._checkRateLimit(ip);
    console.trace("Passed rate limit check");

    // Verify the email OTP.
    const emailVerified = await this.otpService.verifyEmailOtp(userId, emailOtp);
    console.trace("OTP verification result:", emailVerified);

    if (!emailVerified) {
      console.warn(`Email OTP verification failed for user ${userId} from IP ${ip}`);
      throw new Error('Invalid email OTP');
    }

    // Retrieve the temporary user record from Firestore.
    const userDoc = await this.firestore.collection('temp_users').doc(userId).get();
    console.trace("Fetched temp user document:", userDoc.exists);

    if (!userDoc.exists) {
      console.warn(`Temporary user record not found for userId ${userId} from IP ${ip}`);
      throw new Error('Invalid verification session');
    }
    const tempUserData = userDoc.data();

    // Verify the re-entered password against the stored hashed password.
    const isPasswordValid = await bcrypt.compare(plainPassword, tempUserData.password);
    console.trace("Password verification result:", isPasswordValid);

    if (!isPasswordValid) {
      console.warn(`Password verification failed for user ${userId} from IP ${ip}`);
      throw new Error('Invalid password');
    }

    // Create the Firebase user using the plaintext password.
    const userRecord = await admin.auth().createUser({
      email: tempUserData.email,
      phoneNumber: tempUserData.phone, // Optional since SMS OTP is removed.
      password: plainPassword,
      displayName: `${tempUserData.first_name || ''} ${tempUserData.last_name || ''}`.trim(),
      emailVerified: true
    });
    console.trace("Firebase user created:", userRecord.uid);

    // Store the user's profile in Firestore (permanent user record).
    await this.firestore.collection('users').doc(userRecord.uid).set({
      ...tempUserData,
      uid: userRecord.uid,
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.trace("User profile stored in Firestore");

    // Clean up the temporary user record.
    await this.firestore.collection('temp_users').doc(userId).delete();
    console.trace("Temporary user record deleted");

    // Generate JWT tokens for the newly created user.
    const tokens = await this._generateTokens(userRecord);
    console.trace("JWT tokens generated");

    console.info(`User ${userRecord.uid} verified and created successfully from IP ${ip}`);
    console.log(`Audit: Successful registration for user ${userRecord.uid} (email: ${tempUserData.email}, IP: ${ip}).`);

    return {
      success: true,
      userId: userRecord.uid,
      ...tokens
    };
  } catch (error) {
    console.error(`Verification failed for user ${userId} from IP ${ip}: ${error.message}`);
    throw new Error('Verification failed. Please try again.');
  }
}


  /**
   * Generates JWT access and refresh tokens for an authenticated user.
   *
   * @param {Object} userRecord - The Firebase user record.
   * @returns {Promise<Object>} An object containing accessToken, refreshToken, and expiry information.
   */
  async _generateTokens(userRecord) {
    const payload = {
      uid: userRecord.uid,
      email: userRecord.email,
      phone: userRecord.phoneNumber,
      iss: JWT_CONFIG.ISSUER,  // Issuer claim.
      aud: JWT_CONFIG.AUDIENCE // Audience claim.
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.ACCESS_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_EXPIRY
    });
    const refreshToken = jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRY
    });

    // Store the refresh token in Redis (e.g., with a 7-day expiry).
    await this.redis.setex(`refresh:${userRecord.uid}`, 7 * 24 * 60 * 60, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes expressed in seconds.
    };
  }



/**
 * User Login:
 * This function allows an existing user to login by verifying their credentials.
 * It retrieves the user from the Firestore "users" collection, compares the provided password
 * with the stored hashed password, and, if valid, generates JWT tokens.
 *
 * @param {string} email - The user's email.
 * @param {string} plainPassword - The plaintext password.
 * @param {string} ip - The caller's IP address for rate limiting and audit logging.
 * @returns {Promise<Object>} - JWT tokens if login is successful.
 */
async login(email, plainPassword, ip) {
  try {
    // Enforce rate limiting based on IP.
    await this._checkRateLimit(ip);
    
    // Query the "users" collection for a document matching the email.
    const usersSnapshot = await this.firestore
      .collection('users')
      .where('email', '==', email)
      .get();
      
    if (usersSnapshot.empty) {
      console.warn(`Login failed: No user found with email ${email}`);
      throw new Error('Invalid credentials');
    }
    
    // Assume the email is unique and take the first matching document.
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Compare the provided password with the stored hashed password.
    const isValidPassword = await bcrypt.compare(plainPassword, userData.password);
    if (!isValidPassword) {
      console.warn(`Login failed: Incorrect password for email ${email}`);
      throw new Error('Invalid credentials');
    }
    
    // Construct a minimal user record for token generation.
    const userRecord = {
      uid: userData.uid,         // uid stored during registration
      email: userData.email,
      phoneNumber: userData.phone // Optional, since phone is optional.
    };
    
    // Generate and return JWT tokens.
    const tokens = await this._generateTokens(userRecord);
    console.info(`Login successful for user ${userData.uid} from IP ${ip}`);
    console.log(`Audit: User logged in with email ${email} (IP: ${ip}).`);
    return tokens;
    
  } catch (error) {
    console.error(`Login error for email ${email} from IP ${ip}: ${error.message}`);
    throw new Error('Login failed. Please check your credentials and try again.');
  }
}

/**
 * Resend OTP:
 * Allows users to request a new OTP if they haven't received it or if it has expired.
 * It retrieves the pending verification record, generates a new OTP, stores it, and sends a new OTP via email.
 *
 * @param {string} userId - The temporary user identifier.
 * @param {string} ip - The caller's IP address for rate limiting and logging.
 * @returns {Promise<Object>} - Confirmation message indicating that a new OTP was sent.
 */
async resendOTP(userId, ip) {
  try {
    await this._checkRateLimit(ip);
    
    // Retrieve the pending verification record from Firestore.
    const pendingDoc = await this.firestore.collection('pending_verifications').doc(userId).get();
    if (!pendingDoc.exists) {
      console.warn(`Resend OTP failed: No pending verification for user ${userId}`);
      throw new Error('No pending OTP verification session found.');
    }
    const pendingData = pendingDoc.data();
    const email = pendingData.email;
    
    // Generate a new OTP and update the verification record.
    const otp = await this.otpService.generateOtp(userId, email);
    
    // Send the new OTP via email.
    await this.emailService.sendOTP(email, otp);
    
    console.info(`Resent OTP for user ${userId} to email ${email} from IP ${ip}`);
    console.log(`Audit: Resent OTP to ${email} for user ${userId} (IP: ${ip}).`);
    return { success: true, message: 'A new OTP has been sent to your email.' };
    
  } catch (error) {
    console.error(`Resend OTP error for user ${userId} from IP ${ip}: ${error.message}`);
    throw new Error('Unable to resend OTP. Please try again later.');
  }
}

/**
 * Refresh Token:
 * Allows users to obtain new JWT tokens using a valid refresh token.
 * It verifies the refresh token and generates new tokens if the token is valid.
 *
 * @param {string} oldRefreshToken - The refresh token provided by the user.
 * @param {string} ip - The caller's IP address for rate limiting and audit logging.
 * @returns {Promise<Object>} - New JWT tokens upon successful refresh.
 */
async refreshToken(oldRefreshToken, ip) {
  try {
    await this._checkRateLimit(ip);
    
    // Verify the provided refresh token using JWT.
    const payload = jwt.verify(oldRefreshToken, JWT_CONFIG.REFRESH_SECRET);
    
    // Retrieve the stored refresh token from Redis.
    const storedToken = await this.redis.get(`refresh:${payload.uid}`);
    if (storedToken !== oldRefreshToken) {
      console.warn(`Refresh token mismatch for user ${payload.uid} from IP ${ip}`);
      throw new Error('Invalid refresh token');
    }
    
    // Retrieve the user record from Firestore to generate new tokens.
    const userDoc = await this.firestore.collection('users').doc(payload.uid).get();
    if (!userDoc.exists) {
      console.warn(`User record not found for UID ${payload.uid} during token refresh`);
      throw new Error('User not found');
    }
    const userData = userDoc.data();
    const userRecord = {
      uid: userData.uid,
      email: userData.email,
      phoneNumber: userData.phone
    };
    
    // Generate and return new JWT tokens.
    const tokens = await this._generateTokens(userRecord);
    console.info(`Refresh token successful for user ${payload.uid} from IP ${ip}`);
    console.log(`Audit: Token refresh for user ${payload.uid} (IP: ${ip}).`);
    return tokens;
    
  } catch (error) {
    console.error(`Refresh token error from IP ${ip}: ${error.message}`);
    throw new Error('Token refresh failed. Please log in again.');
  }
}

/**
 * Logout:
 * Revokes the user's refresh token, effectively logging them out by removing the token from Redis.
 *
 * @param {string} uid - The unique user identifier.
 * @param {string} ip - The caller's IP address for audit logging.
 * @returns {Promise<Object>} - Confirmation message indicating successful logout.
 */
async logout(uid, ip) {
  try {
    await this._checkRateLimit(ip);
    
    // Delete the stored refresh token for the user from Redis.
    await this.redis.del(`refresh:${uid}`);
    console.info(`Logout successful for user ${uid} from IP ${ip}`);
    console.log(`Audit: User ${uid} logged out (IP: ${ip}).`);
    return { success: true, message: 'Logged out successfully.' };
    
  } catch (error) {
    console.error(`Logout error for user ${uid} from IP ${ip}: ${error.message}`);
    throw new Error('Logout failed. Please try again.');
  }
}

}

/* ----------------------- Updated Blacklist Service with Persistence ----------------------- */

/**
 * BlacklistService manages blacklisting of IP addresses and user identifiers (email/phone).
 * It checks if an IP is blacklisted (via Redis) and adds connection info to the blacklist.
 * The blacklist is stored both in Redis for fast runtime checks and in Firestore for persistence.
 */
export class BlacklistService {
  constructor() {
    this.redis = new Redis(REDIS_CONFIG.URL);
    this.firestore = new Firestore();
    // The runtime blacklist is maintained in Redis (e.g., the "blacklisted_ips" set).
    // Persistent blacklist data is saved in a Firestore collection named "persistent_blacklists".
  }

  /**
   * Checks if the given IP address is in the blacklist (stored in Redis).
   *
   * @param {string} ip - The IP address to check.
   * @returns {Promise<boolean>} True if the IP is blacklisted, otherwise false.
   */
  async isIPBlacklisted(ip) {
    const isBlacklisted = await this.redis.sismember('blacklisted_ips', ip);
    if (isBlacklisted) {
      console.warn(`Connection attempt from blacklisted IP: ${ip}`);
    }
    return isBlacklisted === 1;
  }

  /**
   * Adds a user's connection info (email, phone, ip) to the blacklist.
   * If the same email or phone is associated with multiple IPs, all those IPs are
   * added to the runtime blacklist and persisted to Firestore.
   *
   * @param {Object} userInfo - Contains connection data.
   * @param {string} userInfo.email - The user's email.
   * @param {string} [userInfo.phone] - The user's phone number (optional).
   * @param {string} userInfo.ip - The IP address from which the user connected.
   * @returns {Promise<void>}
   */
  async addUserToBlacklist({ email, phone, ip }) {
    // Store connection info in Redis sets mapping each identifier to its IPs.
    const emailKey = `blacklist:email:${email}`;
    await this.redis.sadd(emailKey, ip);

    if (phone) {
      const phoneKey = `blacklist:phone:${phone}`;
      await this.redis.sadd(phoneKey, ip);
    }

    // Check if the email (or phone) is associated with multiple IPs.
    const emailIPs = await this.redis.smembers(emailKey);
    if (emailIPs.length > 1) {
      await Promise.all(emailIPs.map(existingIp => this.redis.sadd('blacklisted_ips', existingIp)));
      console.warn(`Email ${email} is associated with multiple IPs. Blacklisting IPs: ${emailIPs.join(', ')}`);
      console.log(`Audit: Blacklisted IPs for email ${email}: ${emailIPs.join(', ')}`);
    }

    if (phone) {
      const phoneIPs = await this.redis.smembers(`blacklist:phone:${phone}`);
      if (phoneIPs.length > 1) {
        await Promise.all(phoneIPs.map(existingIp => this.redis.sadd('blacklisted_ips', existingIp)));
        console.warn(`Phone ${phone} is associated with multiple IPs. Blacklisting IPs: ${phoneIPs.join(', ')}`);
        console.log(`Audit: Blacklisted IPs for phone ${phone}: ${phoneIPs.join(', ')}`);
      }
    }

    // Add the current IP to the global runtime blacklist.
    await this.redis.sadd('blacklisted_ips', ip);
    console.info(`User with email ${email} ${phone ? `(and phone ${phone})` : ''} from IP ${ip} added to runtime blacklist.`);

    // Persist the blacklist data in Firestore.
    try {
      // Use the IP as the document ID in the "persistent_blacklists" collection.
      const docRef = this.firestore.collection('persistent_blacklists').doc(ip);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        // Merge new data with existing persistent record.
        const existingData = docSnap.data();
        const updatedEmails = new Set(existingData.emails || []);
        updatedEmails.add(email);

        let updatedPhones = new Set(existingData.phones || []);
        if (phone) {
          updatedPhones.add(phone);
        }
        await docRef.update({
          emails: Array.from(updatedEmails),
          phones: Array.from(updatedPhones),
          updated_at: FieldValue.serverTimestamp()
        });
        console.info(`Updated persistent blacklist record for IP ${ip} in Firestore.`);
      } else {
        // Create a new persistent blacklist record.
        await docRef.set({
          ip,
          emails: [email],
          phones: phone ? [phone] : [],
          created_at: FieldValue.serverTimestamp()
        });
        console.info(`Created persistent blacklist record for IP ${ip} in Firestore.`);
      }
    } catch (err) {
      console.error("Failed to persist blacklist to Firestore", err);
    }
  }
}
