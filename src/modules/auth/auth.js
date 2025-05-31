/*
  Auth Module - Updated Authentication Implementation
  Revised based on new requirements:
    - Removed phone SMS OTP functionality; email OTP remains.
    - Corrected nodemailer transporter configuration.
    - Extended environment variable fail-fast checks (including optional parameters).
    - Implemented exponential backoff (temporary lockout) for OTP verification.
    - Added extensive logging and audit trails for OTP attempts.
    - Enhanced input validation using Joi (a free validation library).
  
  TODO: gather configuration non-sensitive constants in a configuration file, with a mechanism to load at module startup/load
  TODO: why not using Logger module logs, almost all logs are directed to console only, logger
*/

import logger from '../logger/logger.js';
import nodemailer from 'nodemailer';
import Redis from 'ioredis';
import { Firestore, FieldValue } from '@google-cloud/firestore';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import Joi from 'joi'; // Robust, free input validation library

// ----------------------- Preliminary Environment & Security Checks -----------------------
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
    'OTP_EXPIRY', // TODO: explain usage and recommend value
    'JWT_ACCESS_EXPIRY', // TODO: explain usage and recommend value
    'JWT_REFRESH_EXPIRY', // TODO: explain usage and recommend value
    'REDIS_URL' // TODO: explain usage and recommend value
  ];
  requiredEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable "${envVar}" is required for secure operation.`);
    }
  });
  optionalEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      logger.warn(`Optional environment variable "${envVar}" is not set. Using default value if applicable.`);
    }
  });
})();

// ----------------------- Configuration Constants -----------------------

const SALT_ROUNDS = 10; // Number of rounds for bcrypt hashing.

const OTP_CONFIG = { // TODO: fetch values from environment variables or configuration files 
  EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY) || 300, // OTP lifespan, default 5 minutes.
  MAX_ATTEMPTS: 3,     // Maximum allowed OTP verification attempts.
  OTP_LENGTH: 6        // Length of the OTP code.
};

const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  ISSUER: 'BadrDeliveryAuth',
  AUDIENCE: 'BadrDeliveryUsers'
};

const REDIS_CONFIG = {
  URL: process.env.REDIS_URL || 'redis://localhost:6379'
};

// TODO: use environment variables, advice a mechanism to load environment variables at once
const LOCKOUT_BASE_DURATION = 60; // Base duration in seconds for exponential backoff.

// ----------------------- Utility: Input Validation using Joi -----------------------

// TODO: should we check for role validity
function validateUserData(data) {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address.',
      'any.required': 'Email is required.'
    }),
    // Phone is now optional.
    phone: Joi.string().pattern(/^\+?\d{7,15}$/).optional().messages({
      'string.pattern.base': 'Phone must be a valid phone number with 7-15 digits.'
    }),
    // TODO: use constant/environment variable for minimum password length
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

// TODO: Should this be embedded in OTPService, like sendOTP, as it already has generate and verify ?
export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  async sendOTP(email, otp) {
    try {
      await this.transporter.sendMail({
        from: `"Badr Delivery" <${process.env.GMAIL_EMAIL}>`,
        to: email,
        subject: 'Your OTP Code',
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });
      logger.info(`OTP email sent to ${email}`);
    } catch (error) {
      logger.error('Email sending failed', { error });
      throw new Error('Failed to send OTP. Please try again later.');
    }
  }
}

// ----------------------- OTP Service -----------------------

// TODO: why not just OTP ?
// TODO: should this be in a separate module for global reusability ?
export class OTPService {
  constructor() {
    // TODO: Why creating its own instance, why not module level or singleton ?
    this.redis = new Redis(REDIS_CONFIG.URL);

    // TODO: Why creating its own firestore instance ? why not shared instance/singleton ?
    this.firestore = new Firestore();
  }

  async generateOtp(userId, email) {
    const otp = this._generateCode();
    await this.redis.setex(`otp:email:${email}`, OTP_CONFIG.EXPIRY_SECONDS, otp);
    await this.firestore.collection('pending_verifications').doc(userId).set({
      email,
      created_at: FieldValue.serverTimestamp(),
      otp_attempts: 0,
      lockedUntil: null
    });
    logger.info(`Generated OTP for user ${userId} and email ${email}`);
    logger.info(`Audit: OTP generated for user (${userId}, email: ${email}).`);
    return otp;
  }

  async verifyEmailOtp(userId, otp) {
    try {
      logger.debug("Entering verifyEmailOtp");
      const pendingDoc = await this.firestore.collection('pending_verifications').doc(userId).get();
      logger.debug("Fetched pending_verifications doc", { exists: pendingDoc.exists });
      if (!pendingDoc.exists) {
        logger.warn(`Pending verification record not found for user ${userId}`);
        return false;
      }
      const data = pendingDoc.data();
      const email = data.email;
      let attempts = data.otp_attempts || 0;
      let lockedUntil = data.lockedUntil;
      const now = Date.now();
      if (lockedUntil && now < lockedUntil) {
        logger.warn(`OTP verification blocked for ${email} until ${new Date(lockedUntil).toISOString()}`);
        return false;
      }
      logger.debug(`Before calling redis.get() for key otp:email:${email}`);
      const storedOtp = await this.redis.get(`otp:email:${email}`);
      logger.debug(`Redis returned OTP: ${storedOtp}`);
      if (storedOtp !== otp) {
        attempts += 1;
        if (attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
          const lockoutSeconds = LOCKOUT_BASE_DURATION * Math.pow(2, attempts - OTP_CONFIG.MAX_ATTEMPTS);
          lockedUntil = now + lockoutSeconds * 1000;
          logger.warn(`Exceeded max attempts for ${email}. Locking out until ${new Date(lockedUntil).toISOString()}`);
        }
        logger.debug("Updating OTP attempts", { attempts, lockedUntil });
        await this.firestore.collection('pending_verifications').doc(userId).update({
          otp_attempts: attempts,
          lockedUntil
        });
        return false;
      }
      logger.debug("OTP verified successfully. Cleaning up.");
      await Promise.all([
        this.redis.del(`otp:email:${email}`),
        this.firestore.collection('pending_verifications').doc(userId).delete()
      ]);
      logger.debug("Cleanup completed, exiting verifyEmailOtp with success.");
      return true;
    } catch (err) {
      logger.error("Error during verifyEmailOtp", { error: err });
      throw err;
    }
  }

  async _cleanupOtp(userId, email) {
    await Promise.all([
      this.redis.del(`otp:email:${email}`),
      this.firestore.collection('pending_verifications').doc(userId).delete()
    ]);
    logger.info(`Cleaned up OTP data for user ${userId} and email ${email}`);
  }

  // TODO: use more descriptive name and refactor where needed
  _generateCode() {
    return Math.floor(
      Math.pow(10, OTP_CONFIG.OTP_LENGTH - 1) +
      Math.random() * 9 * Math.pow(10, OTP_CONFIG.OTP_LENGTH - 1)
    ).toString();
  }
}// ----------------------- Auth Controller & Further Operations -----------------------

export class AuthController {
  constructor() {
    this.otpService = new OTPService();
    this.emailService = new EmailService();
    this.redis = new Redis(REDIS_CONFIG.URL); // For storing JWT refresh tokens & rate limiting.
    this.firestore = new Firestore();
  }

  // TODO: is this method private ? I think we will need it in all APIs so advice a better scope to use it globally
  async _checkRateLimit(ip) {
    // TODO: use configuration constants/environment variables to obtain these configuration constants
    const key = `rate:${ip}`;
    const requests = await this.redis.incr(key);
    const RATE_LIMIT_WINDOW = 60; // In seconds.
    const RATE_LIMIT = 100; // Maximum requests per minute per IP.
    if (requests === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW);
    }
    if (requests > RATE_LIMIT) {
      logger.warn(`Rate limit exceeded for IP ${ip}. Request count: ${requests}.`);
      throw new Error('Too many requests. Please try again later.');
    }
  }

  // ----------------------- Registration & Verification -----------------------
  // TODO: why not just call method register/signup ?
  // TODO: what is included in userData, does it include roles array ?
  async initiateRegistration(userData, ip) {
    try {
      // TODO: this way we are allowing an IP to try registering 100 per minute, i think this is vulnerability
      await this._checkRateLimit(ip);
      validateUserData(userData);

      try {
        await admin.auth().getUserByEmail(userData.email);
        throw new Error('Email already in use');
      } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
      }

      const plainPassword = userData.password;
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      userData.password = hashedPassword; // Replace plaintext with hashed password.

      const userRef = this.firestore.collection('temp_users').doc();

      // TODO: do we need to add roles with default customer role here ?
      await userRef.set({
        ...userData,
        created_at: FieldValue.serverTimestamp(),
        status: 'pending_verification'
      });

      // Generate and send OTP.
      const emailOtp = await this.otpService.generateOtp(userRef.id, userData.email);
      await this.emailService.sendOTP(userData.email, emailOtp);

      logger.info(`Registration initiated for email ${userData.email} from IP ${ip}`);
      logger.info(`Audit: Initiated registration for user ${userRef.id} (email: ${userData.email}, IP: ${ip}).`);

      return {
        success: true,
        userId: userRef.id,
        nextStep: 'verify_otp',
        message: 'OTP sent to email'
      };
    } catch (error) {
      logger.error(`Registration failed for IP ${ip}: ${error.message}`);
      throw new Error('Registration failed. Please try again.');
    }
  }

  async verifyRegistration(userId, emailOtp, plainPassword, ip) {
    try {
      logger.debug("Entering verifyRegistration");
      await this._checkRateLimit(ip);
      const emailVerified = await this.otpService.verifyEmailOtp(userId, emailOtp);
      logger.debug("OTP verification result", { emailVerified });
      if (!emailVerified) {
        logger.warn(`Email OTP verification failed for user ${userId} from IP ${ip}`);
        throw new Error('Invalid email OTP');
      }

      const userDoc = await this.firestore.collection('temp_users').doc(userId).get();
      logger.debug("Fetched temp user document", { exists: userDoc.exists });
      if (!userDoc.exists) {
        logger.warn(`Temporary user record not found for userId ${userId} from IP ${ip}`);
        throw new Error('Invalid verification session');
      }
      const tempUserData = userDoc.data();
      const isPasswordValid = await bcrypt.compare(plainPassword, tempUserData.password);
      logger.debug("Password verification result", { isPasswordValid });
      if (!isPasswordValid) {
        logger.warn(`Password verification failed for user ${userId} from IP ${ip}`);
        throw new Error('Invalid password');
      }

      const userRecord = await admin.auth().createUser({
        email: tempUserData.email,
        phoneNumber: tempUserData.phone,
        password: plainPassword,
        displayName: `${tempUserData.first_name || ''} ${tempUserData.last_name || ''}`.trim(),
        emailVerified: true
      });
      logger.debug("Firebase user created", { uid: userRecord.uid });
      await this.firestore.collection('users').doc(userRecord.uid).set({
        ...tempUserData,
        uid: userRecord.uid,
        status: 'active',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.debug("User profile stored in Firestore");
      await this.firestore.collection('temp_users').doc(userId).delete();
      logger.debug("Temporary user record deleted");

      // Generate tokens with the default "customer" role.
      // TODO: use a defined constant for default role
      const tokens = await this._generateTokens(userRecord, 'customer');
      logger.debug("JWT tokens generated");

      logger.info(`User ${userRecord.uid} verified and created successfully from IP ${ip}`);
      logger.info(`Audit: Successful registration for user ${userRecord.uid} (email: ${tempUserData.email}, IP: ${ip}).`);

      return {
        success: true,
        userId: userRecord.uid,
        ...tokens
      };
    } catch (error) {
      logger.error(`Verification failed for user ${userId} from IP ${ip}: ${error.message}`);
      throw new Error('Verification failed. Please try again.');
    }
  }

  async login(identifier, plainPassword, loginRole, ip, method = 'phone') {
    try {
      await this._checkRateLimit(ip);
      let queryField;
      if (method === 'phone') {
        queryField = 'phone';
      } else if (method === 'email') {
        queryField = 'email';
      } else {
        throw new Error('Invalid login method specified.');
      }

      const usersSnapshot = await this.firestore.collection('users')
        .where(queryField, '==', identifier)
        .get();

      if (usersSnapshot.empty) {
        logger.warn(`Login failed: No user found with ${queryField} ${identifier}`);
        throw new Error('Invalid credentials');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const isValidPassword = await bcrypt.compare(plainPassword, userData.password);
      if (!isValidPassword) {
        logger.warn(`Login failed: Incorrect password for ${queryField} ${identifier}`);
        throw new Error('Invalid credentials');
      }

      // Handle role selection.
      // TODO: handle userData.roles is null, assume default role is customer
      if (!loginRole) {
        if (userData.roles.length === 1) {
          loginRole = userData.roles[0];
        } else {
          throw new Error("Multiple roles available. Please provide a loginRole parameter.");
        }
      } else if (!userData.roles.includes(loginRole)) {
        throw new Error("Selected role is not assigned to this user.");
      }

      // Generate and send OTP to the user's registered email.
      const otp = await this.otpService.generateOtp(userDoc.id, userData.email);
      await this.emailService.sendOTP(userData.email, otp);

      logger.info(`OTP sent to registered email for user ${userData.uid} from IP ${ip}`);
      return {
        success: true,
        message: "OTP sent to registered email. Please verify OTP using verifyLoginOTP.",
        userId: userDoc.id,
        loginRole,
        method
      };
    } catch (error) {
      logger.error(`Login error for identifier ${identifier} from IP ${ip}: ${error.message}`);
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }

  async verifyLoginOTP(userId, otp, loginRole, ip) {
    try {
      await this._checkRateLimit(ip);
      const otpValid = await this.otpService.verifyEmailOtp(userId, otp);
      if (!otpValid) {
        throw new Error("Invalid OTP.");
      }

      const userDoc = await this.firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("User not found.");
      }
      const userData = userDoc.data();
      if (!userData.roles.includes(loginRole)) {
        throw new Error("User does not have the selected role.");
      }

      // Generate tokens embedding only the selected role.
      // TODO: I think token generation should be separated and handled by the calling method
      const tokens = await this._generateTokens(userData, loginRole);
      logger.info(`OTP verification successful for user ${userId} with role ${loginRole}`);
      return {
        success: true,
        ...tokens
      };
    } catch (error) {
      logger.error(`OTP verification failed for user ${userId} from IP ${ip}: ${error.message}`);
      throw new Error('OTP verification failed. Please try again.');
    }
  }

  /**
   * Generates JWT access and refresh tokens.
   * Now accepts an optional selectedRole parameter to embed only that role in the token payload.
   * Sensitive fields like email and phone are omitted.
   */
  // TODO: I think we should refactor user data so that user record has a current role attribute so we don't keep passing selected role everywhere, it should be kept with user record/data/profile and accessed from there with a default value of customer
  async _generateTokens(userRecord, selectedRole) {
    const payload = {
      uid: userRecord.uid,
      // TODO: who said array should contain at least one element, it could be empty
      // TODO: I think next line should be: role: selectedRole || 'customer',
      role: selectedRole || (Array.isArray(userRecord.roles) ? userRecord.roles[0] : 'customer'),
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.ACCESS_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_EXPIRY
    });
    const refreshToken = jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRY
    });

    // TODO: use a configuration constant instead of magic numbers
    await this.redis.setex(`refresh:${userRecord.uid}`, 7 * 24 * 60 * 60, refreshToken);

    return {
      accessToken,
      refreshToken,
      // TODO: what does this value mean, 15 minutes ??
      expiresIn: 15 * 60 // 15 minutes in seconds.
    };
  }

  async resendOTP(userId, ip) {
    try {
      await this._checkRateLimit(ip);
      const pendingDoc = await this.firestore.collection('pending_verifications').doc(userId).get();
      if (!pendingDoc.exists) {
        logger.warn(`Resend OTP failed: No pending verification for user ${userId}`);
        throw new Error('No pending OTP verification session found.');
      }
      const pendingData = pendingDoc.data();
      const email = pendingData.email;
      const otp = await this.otpService.generateOtp(userId, email);
      await this.emailService.sendOTP(email, otp);
      logger.info(`Resent OTP for user ${userId} to email ${email} from IP ${ip}`);
      logger.info(`Audit: Resent OTP to ${email} for user ${userId} (IP: ${ip}).`);
      return { success: true, message: 'A new OTP has been sent to your email.' };
    } catch (error) {
      logger.error(`Resend OTP error for user ${userId} from IP ${ip}: ${error.message}`);
      throw new Error('Unable to resend OTP. Please try again later.');
    }
  }

  async refreshToken(oldRefreshToken, ip) {
    try {
      await this._checkRateLimit(ip);
      const payload = jwt.verify(oldRefreshToken, JWT_CONFIG.REFRESH_SECRET);
      const storedToken = await this.redis.get(`refresh:${payload.uid}`);
      if (storedToken !== oldRefreshToken) {
        logger.warn(`Refresh token mismatch for user ${payload.uid} from IP ${ip}`);
        throw new Error('Invalid refresh token');
      }
      const userDoc = await this.firestore.collection('users').doc(payload.uid).get();
      if (!userDoc.exists) {
        logger.warn(`User record not found for UID ${payload.uid} during token refresh`);
        throw new Error('User not found');
      }
      const userData = userDoc.data();
      const tokens = await this._generateTokens(userData);
      logger.info(`Refresh token successful for user ${payload.uid} from IP ${ip}`);
      logger.info(`Audit: Token refresh for user ${payload.uid} (IP: ${ip}).`);
      return tokens;
    } catch (error) {
      logger.error(`Refresh token error from IP ${ip}: ${error.message}`);
      throw new Error('Token refresh failed. Please log in again.');
    }
  }

  async logout(uid, ip) {
    try {
      await this._checkRateLimit(ip);
      await this.redis.del(`refresh:${uid}`);
      logger.info(`Logout successful for user ${uid} from IP ${ip}`);
      logger.info(`Audit: User ${uid} logged out (IP: ${ip}).`);
      return { success: true, message: 'Logged out successfully.' };
    } catch (error) {
      logger.error(`Logout error for user ${uid} from IP ${ip}: ${error.message}`);
      throw new Error('Logout failed. Please try again.');
    }
  }
}

export class BlacklistService {
  constructor() {
    this.redis = new Redis(REDIS_CONFIG.URL);
    this.firestore = new Firestore();
  }

  async isIPBlacklisted(ip) {
    const isBlacklisted = await this.redis.sismember('blacklisted_ips', ip);
    if (isBlacklisted) {
      logger.warn(`Connection attempt from blacklisted IP: ${ip}`);
    }
    return isBlacklisted === 1;
  }

  async addUserToBlacklist({ email, phone, ip }) {
    const emailKey = `blacklist:email:${email}`;
    await this.redis.sadd(emailKey, ip);

    if (phone) {
      const phoneKey = `blacklist:phone:${phone}`;
      await this.redis.sadd(phoneKey, ip);
    }

    const emailIPs = await this.redis.smembers(emailKey);
    if (emailIPs.length > 1) {
      await Promise.all(emailIPs.map(existingIp => this.redis.sadd('blacklisted_ips', existingIp)));
      logger.warn(`Email ${email} is associated with multiple IPs. Blacklisting IPs: ${emailIPs.join(', ')}`);
      logger.info(`Audit: Blacklisted IPs for email ${email}: ${emailIPs.join(', ')}`);
    }

    if (phone) {
      const phoneIPs = await this.redis.smembers(`blacklist:phone:${phone}`);
      if (phoneIPs.length > 1) {
        await Promise.all(phoneIPs.map(existingIp => this.redis.sadd('blacklisted_ips', existingIp)));
        logger.warn(`Phone ${phone} is associated with multiple IPs. Blacklisting IPs: ${phoneIPs.join(', ')}`);
        logger.info(`Audit: Blacklisted IPs for phone ${phone}: ${phoneIPs.join(', ')}`);
      }
    }

    await this.redis.sadd('blacklisted_ips', ip);
    logger.info(`User with email ${email} ${phone ? `(and phone ${phone})` : ''} from IP ${ip} added to runtime blacklist.`);

    try {
      const docRef = this.firestore.collection('persistent_blacklists').doc(ip);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
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
        logger.info(`Updated persistent blacklist record for IP ${ip} in Firestore.`);
      } else {
        await docRef.set({
          ip,
          emails: [email],
          phones: phone ? [phone] : [],
          created_at: FieldValue.serverTimestamp()
        });
        logger.info(`Created persistent blacklist record for IP ${ip} in Firestore.`);
      }
    } catch (err) {
      logger.error("Failed to persist blacklist to Firestore", { error: err });
    }
  }
}
