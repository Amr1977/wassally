// tests/blacklistService.test.mjs
import { jest } from '@jest/globals';
import { BlacklistService } from "../src/modules/auth/auth.js";

describe('BlacklistService', () => {
  let blacklistService;
  let redisStub, firestoreStub;
  
  beforeEach(() => {
    redisStub = {
      sismember: jest.fn().mockResolvedValue(0),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue(['127.0.0.1']),
    };
    firestoreStub = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: false }),
          set: jest.fn().mockResolvedValue(),
          update: jest.fn().mockResolvedValue(),
        }),
      }),
    };
    
    blacklistService = new BlacklistService();
    blacklistService.redis = redisStub;
    blacklistService.firestore = firestoreStub;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should return false when IP is not blacklisted', async () => {
    redisStub.sismember.mockResolvedValue(0);
    const result = await blacklistService.isIPBlacklisted('127.0.0.1');
    expect(result).toBe(false);
  });
  
  test('should return true when IP is blacklisted', async () => {
    redisStub.sismember.mockResolvedValue(1);
    const result = await blacklistService.isIPBlacklisted('127.0.0.1');
    expect(result).toBe(true);
  });
  
  test('should add user to blacklist and persist to Firestore', async () => {
    // Simulate that the email is linked to multiple IPs.
    redisStub.smembers.mockImplementation((key) => {
      if (key === 'blacklist:email:user@example.com') {
        return Promise.resolve(['127.0.0.1', '192.168.1.1']);
      }
      return Promise.resolve([]);
    });
    await blacklistService.addUserToBlacklist({
      email: 'user@example.com',
      phone: '1234567890',
      ip: '10.0.0.1'
    });
    expect(redisStub.sadd).toHaveBeenCalled();
    expect(firestoreStub.collection).toHaveBeenCalledWith('persistent_blacklists');
  });
});