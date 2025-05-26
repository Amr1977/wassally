// auth.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailService, OTPService, FirebaseSmsService, AuthController } from './auth.js';

// ------------------------------
// Mocks Setup
// ------------------------------

/* ----- Nodemailer ----- */
vi.mock('nodemailer', () => {
  return {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true)
    }),
  };
});

/* ----- Redis (ioredis) ----- */
vi.mock('ioredis', () => {
  return vi.fn().mockImplementation(() => ({
    setex: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true),
  }));
});

/* ----- Firestore ----- */
// Fake document for chaining calls (set, update, delete, and get).
const fakeDoc = {
  set: vi.fn().mockResolvedValue(true),
  update: vi.fn().mockResolvedValue(true),
  delete: vi.fn().mockResolvedValue(true),
  get: vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      email: 'test@example.com',
      phone: '+1234567890',
      otp_attempts: 0,
      password: 'hashedPassword'
    })
  }),
};

const fakeCollection = {
  doc: vi.fn(() => fakeDoc),
};

vi.mock('@google-cloud/firestore', () => {
  return {
    Firestore: vi.fn().mockImplementation(() => ({
      collection: vi.fn().mockReturnValue(fakeCollection)
    })),
    FieldValue: {
      serverTimestamp: vi.fn(),
    },
  };
});

/* ----- JSON Web Token (jsonwebtoken) ----- */
vi.mock('jsonwebtoken', () => {
  return {
    sign: vi.fn((payload, secret, options) => {
      // For testing, simply return a token string that includes the uid.
      return `signedToken_${payload.uid || 'no_uid'}`;
    }),
  };
});

/* ----- Firebase Admin ----- */
vi.mock('firebase-admin', () => {
  return {
    auth: vi.fn(() => ({
      getUserByEmail: vi.fn(() => Promise.reject({ code: 'auth/user-not-found' })),
      createUser: vi.fn(() =>
        Promise.resolve({
          uid: 'newUser123',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
        })
      ),
    })),
  };
});

/* ----- Bcrypt ----- */
vi.mock('bcrypt', () => {
  return {
    hash: vi.fn((plain, saltRounds) =>
      Promise.resolve(`hashedPassword_${plain}`)
    ),
    compare: vi.fn((plain, hash) =>
      Promise.resolve(plain === 'validPassword')
    ),
  };
});

/* ----- Node-Fetch ----- */
vi.mock('node-fetch', () => vi.fn());


/* ------------------------------
   TESTS
------------------------------ */

describe('EmailService', () => {
  let emailService;
  let sendMailMock;

  beforeEach(() => {
    emailService = new EmailService();
    // Get the mocked sendMail function
    sendMailMock = emailService.transporter.sendMail;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send OTP email successfully', async () => {
    const email = 'recipient@example.com';
    const otp = '123456';
    await expect(emailService.sendOTP(email, otp)).resolves.not.toThrow();
    expect(sendMailMock).toHaveBeenCalledWith({
      from: `"Badr Delivery" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    });
  });

  it('should throw a generic error if email sending fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP Error'));
    await expect(emailService.sendOTP('fail@example.com', '000000')).rejects.toThrow(
      'Failed to send OTP. Please try again later.'
    );
  });
});


describe('OTPService', () => {
  let otpService;

  beforeEach(() => {
    otpService = new OTPService();
    vi.clearAllMocks();
  });

  it('should generate dual OTPs with correct length', async () => {
    // Spy on _generateCode to return a fixed 6-digit code.
    vi.spyOn(otpService, '_generateCode').mockReturnValue('123456');
    const userId = 'user1';
    const email = 'test@example.com';
    const phone = '+1234567890';
    const result = await otpService.generateDualOtp(userId, email, phone);
    expect(result).toEqual({
      emailOtp: '123456',
      smsOtp: '123456',
    });
    expect(otpService.redis.setex).toHaveBeenCalledTimes(2);
    expect(fakeCollection.doc).toHaveBeenCalled(); // Verification record stored.
    expect(fakeDoc.set).toHaveBeenCalled();
  });

  it('should verify email OTP successfully', async () => {
    // Setup: Firestore returning a document with otp_attempts 0.
    fakeDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ email: 'test@example.com', otp_attempts: 0 }),
    });
    // Redis returns the correct OTP.
    otpService.redis.get = vi.fn().mockResolvedValue('123456');
    const verified = await otpService.verifyEmailOtp('user1', '123456');
    expect(verified).toBe(true);
    // Verify cleanup was called.
    expect(otpService.redis.del).toHaveBeenCalledWith(`otp:email:test@example.com`);
    expect(fakeDoc.delete).toHaveBeenCalled();
  });

  it('should increment OTP attempt when OTP does not match', async () => {
    fakeDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ email: 'test@example.com', otp_attempts: 0 }),
    });
    otpService.redis.get = vi.fn().mockResolvedValue('654321');
    const verified = await otpService.verifyEmailOtp('user1', '123456');
    expect(verified).toBe(false);
    expect(fakeDoc.update).toHaveBeenCalledWith({ otp_attempts: 1 });
  });
});


describe('FirebaseSmsService', () => {
  let smsService;
  beforeEach(() => {
    smsService = new FirebaseSmsService();
    vi.clearAllMocks();
  });

  it('should initiate phone verification successfully', async () => {
    // Simulate a successful fetch response with sessionInfo.
    const fakeFetchResponse = {
      json: vi.fn().mockResolvedValue({ sessionInfo: 'session123' }),
    };
    vi.mocked(fetch).mockResolvedValueOnce(fakeFetchResponse);
    const result = await smsService.initiatePhoneVerification('+1234567890');
    expect(result).toEqual({ verificationId: 'session123' });
    expect(fetch).toHaveBeenCalled();
  });

  it('should throw an error during SMS initiation if Firebase returns error', async () => {
    const fakeFetchResponse = {
      json: vi.fn().mockResolvedValue({ error: { message: 'Quota exceeded' } }),
    };
    vi.mocked(fetch).mockResolvedValueOnce(fakeFetchResponse);
    await expect(smsService.initiatePhoneVerification('+1234567890')).rejects.toThrow(
      'SMS verification failed. Please try again.'
    );
  });

  it('should verify phone OTP successfully', async () => {
    const fakeFetchResponse = {
      json: vi.fn().mockResolvedValue({ idToken: 'idToken123' }),
    };
    vi.mocked(fetch).mockResolvedValueOnce(fakeFetchResponse);
    const result = await smsService.verifyPhoneOtp('session123', '123456');
    expect(result).toEqual({ verified: true, idToken: 'idToken123' });
  });

  it('should throw error if phone OTP verification fails', async () => {
    const fakeFetchResponse = {
      json: vi.fn().mockResolvedValue({ error: { message: 'Invalid code' } }),
    };
    vi.mocked(fetch).mockResolvedValueOnce(fakeFetchResponse);
    await expect(smsService.verifyPhoneOtp('fakeSession', '000000')).rejects.toThrow(
      'SMS verification failed. Please try again.'
    );
  });
});


describe('AuthController', () => {
  let authController;
  
  beforeEach(() => {
    authController = new AuthController();
    vi.clearAllMocks();

    // Override OTPService.generateDualOtp to return fixed OTPs.
    authController.otpService.generateDualOtp = vi.fn().mockResolvedValue({
      emailOtp: '111111',
      smsOtp: '222222',
    });
    // Override EmailService.sendOTP.
    authController.emailService.sendOTP = vi.fn().mockResolvedValue(true);
    // Override FirebaseSmsService.verifyPhoneOtp.
    authController.smsService.verifyPhoneOtp = vi.fn().mockResolvedValue({
      verified: true,
      idToken: 'idToken123',
    });
    // Override OTPService.verifyEmailOtp.
    authController.otpService.verifyEmailOtp = vi.fn().mockResolvedValue(true);

    // For temporary user data, ensure Firestore returns a valid user document.
    fakeDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'hashedPassword', // Matches our bcrypt.compare condition.
        first_name: 'Test',
        last_name: 'User',
      }),
    });
    // Reset delete mock.
    fakeDoc.delete.mockResolvedValue(true);
  });

  it('should initiate registration successfully', async () => {
    const userData = {
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'validPassword',
      first_name: 'Test',
      last_name: 'User',
    };

    const result = await authController.initiateRegistration(userData);
    expect(result).toEqual({
      success: true,
      userId: expect.any(String),
      nextStep: 'verify_otp',
      message: 'OTP sent to email',
    });
    expect(authController.otpService.generateDualOtp).toHaveBeenCalled();
    expect(authController.emailService.sendOTP).toHaveBeenCalledWith('test@example.com', '111111');
  });

  it('should verify registration successfully and return tokens', async () => {
    // Given that bcrypt.compare resolves to true for "validPassword"
    const result = await authController.verifyRegistration(
      'tempUserId123',          // temporary user ID
      '111111',                 // email OTP
      '222222',                 // sms OTP
      'verificationSession123', // verification ID
      'validPassword'           // valid plaintext password
    );
    expect(result).toEqual({
      success: true,
      userId: 'newUser123',
      accessToken: expect.stringContaining('signedToken_newUser123'),
      refreshToken: expect.stringContaining('signedToken_newUser123'),
      expiresIn: 15 * 60,
    });
    expect(authController.smsService.verifyPhoneOtp).toHaveBeenCalled();
    expect(authController.otpService.verifyEmailOtp).toHaveBeenCalled();
    expect(admin.auth().createUser).toHaveBeenCalled();
    expect(fakeDoc.delete).toHaveBeenCalled();
  });

  it('should fail verification if password is invalid', async () => {
    // Override bcrypt.compare to return false for an invalid password.
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);
    await expect(
      authController.verifyRegistration(
        'tempUserId123',
        '111111',
        '222222',
        'verificationSession123',
        'invalidPassword'
      )
    ).rejects.toThrow('Verification failed. Please try again.');
  });
});