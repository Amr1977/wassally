// tests/emailService.test.mjs
import { jest } from '@jest/globals';
import { EmailService } from "../src/modules/auth/auth.js";
import nodemailer from 'nodemailer';

describe('EmailService', () => {
  let emailService;
  let sendMailMock;
  
  beforeEach(() => {
    // Set up required environment variables.
    process.env.GMAIL_EMAIL = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'testpassword';
    
    // Stub nodemailer.createTransport to return an object with a fake sendMail.
    sendMailMock = jest.fn().mockResolvedValue();
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    });
    
    emailService = new EmailService();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should send an OTP email successfully', async () => {
    const otp = '123456';
    await emailService.sendOTP('user@example.com', otp);
    
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.to).toBe('user@example.com');
    expect(mailArgs.html).toContain(otp);
  });
  
  test('should throw an error if sending email fails', async () => {
    // Force sendMail to fail.
    sendMailMock.mockRejectedValue(new Error('SMTP error'));
    
    await expect(emailService.sendOTP('user@example.com', '123456'))
      .rejects
      .toThrow('Failed to send OTP. Please try again later.');
  });
});