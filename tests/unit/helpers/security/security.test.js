// =============================================================================
// TEST SUITE FOR HELPERS/SECURITY.HELPER.JS
// =============================================================================
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const sanitize = require('sanitize-html');

// Mock internal dependencies
const cacheHelper = require('../../../../helpers/cache.helper');
const config = require('../../../../config/env');
const i18n = require('../../../../config/i18n');
const { THREAT_LEVELS, SECURITY_CONFIG } = require('../../../../helpers/constants.helper');

// Mock entire modules
jest.mock('crypto');
jest.mock('bcrypt');
jest.mock('@hapi/boom');
jest.mock('jsonwebtoken');
jest.mock('moment');
jest.mock('rate-limiter-flexible');
jest.mock('sanitize-html');
jest.mock('../../../../helpers/cache.helper');
jest.mock('../../../../config/env');
jest.mock('../../../../config/i18n');
jest.mock('../../../../helpers/constants.helper');

// Import the module to be tested
const securityHelper = require('../../../../helpers/security.helper');

describe('helpers/security.helper.js', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    config.jwt = {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'test-issuer',
      audience: 'test-audience',
    };
    SECURITY_CONFIG.PASSWORD_POLICY = { SALT: 10 };
    THREAT_LEVELS.LOW = 'LOW';
    THREAT_LEVELS.MEDIUM = 'MEDIUM';
    THREAT_LEVELS.HIGH = 'HIGH';
    THREAT_LEVELS.CRITICAL = 'CRITICAL';
    i18n.__ = jest.fn((key) => key);
    const mockMoment = {
      valueOf: jest.fn().mockReturnValue(1678886400000), // Fixed timestamp
      add: jest.fn().mockReturnThis(),
      toISOString: jest.fn().mockReturnValue('2023-03-15T12:00:00.000Z'),
    };
    moment.mockReturnValue(mockMoment);
  });

  // =======================================================================
  //  UTILITY FUNCTIONS
  // =======================================================================

  describe('generateSecureToken', () => {
    it('should generate a random token of specified length', () => {
      const buffer = Buffer.from('randombytes');
      crypto.randomBytes.mockReturnValue(buffer);
      const token = securityHelper.generateSecureToken(32);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe(buffer.toString('hex'));
    });

    it('should use default length of 32 if not specified', () => {
      const buffer = Buffer.from('defaultrandombytes');
      crypto.randomBytes.mockReturnValue(buffer);
      const token = securityHelper.generateSecureToken();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe(buffer.toString('hex'));
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return the current timestamp from moment', () => {
      const timestamp = securityHelper.getCurrentTimestamp();
      expect(moment).toHaveBeenCalled();
      expect(timestamp).toBe(1678886400000);
    });
  });

  describe('sanitizeLogData', () => {
    it('should sanitize a string by removing control characters', () => {
      const sanitized = securityHelper.sanitizeLogData('line1\nline2\tline3\r');
      expect(sanitized).toBe('line1 line2 line3 ');
    });

    it('should truncate a string longer than 500 characters', () => {
      const longString = 'a'.repeat(600);
      const sanitized = securityHelper.sanitizeLogData(longString);
      expect(sanitized).toHaveLength(500);
    });

    it('should recursively sanitize an object', () => {
      const data = { user: 'test', pass: 'secret\npassword' };
      const sanitized = securityHelper.sanitizeLogData(data);
      expect(sanitized).toEqual({ user: 'test', pass: 'secret password' });
    });

    it('should return non-string, non-object data as is', () => {
      expect(securityHelper.sanitizeLogData(123)).toBe(123);
      expect(securityHelper.sanitizeLogData(null)).toBeNull();
      expect(securityHelper.sanitizeLogData(true)).toBe(true);
    });
  });

  describe('sanitizeHTML', () => {
    it('should sanitize HTML with default options', () => {
      const dirtyHtml = '<script>alert("xss")</script><p>Hello</p>';
      securityHelper.sanitizeHTML(dirtyHtml);
      expect(sanitize).toHaveBeenCalledWith(
        dirtyHtml,
        expect.objectContaining({
          allowedTags: expect.any(Array),
        })
      );
    });

    it('should merge custom options with default options', () => {
      const dirtyHtml = '<h1>Title</h1>';
      const options = { allowedTags: ['h1'] };
      securityHelper.sanitizeHTML(dirtyHtml, options);
      expect(sanitize).toHaveBeenCalledWith(
        dirtyHtml,
        expect.objectContaining({
          allowedTags: ['h1'],
        })
      );
    });
  });

  // =======================================================================
  //  PASSWORD SECURITY
  // =======================================================================

  describe('hashPassword', () => {
    it('should hash a password with specified salt rounds', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      const hash = await securityHelper.hashPassword('password123', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(hash).toBe('hashed_password');
    });

    it('should use default salt rounds from config', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password_default');
      const hash = await securityHelper.hashPassword('password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(hash).toBe('hashed_password_default');
    });
  });

  describe('verifyPassword', () => {
    it('should call bcrypt.compare and return its result', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const result = await securityHelper.verifyPassword('password123', 'hashed_password');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toBe(true);
    });
  });

  // =======================================================================
  //  JWT FUNCTIONS
  // =======================================================================

  describe('createJWT', () => {
    it('should create a JWT with default and custom options', () => {
      crypto.randomBytes.mockReturnValue(Buffer.from('jwtid'));
      jwt.sign.mockReturnValue('signed_token');
      const payload = { userId: 1 };
      const secret = 'secret';
      const options = { expiresIn: '2h' };

      const token = securityHelper.createJWT(payload, secret, options);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        secret,
        expect.objectContaining({
          ...options,
          algorithm: 'HS256',
          issuer: 'test-issuer',
          audience: 'test-audience',
          jwtid: '6a77746964', // hex of 'jwtid'
        })
      );
      expect(token).toBe('signed_token');
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid token and return the payload', () => {
      const payload = { userId: 1 };
      jwt.verify.mockReturnValue(payload);
      const decoded = securityHelper.verifyJWT('valid_token', 'secret');
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'secret', expect.any(Object));
      expect(decoded).toEqual(payload);
    });

    it('should throw a Boom error for an invalid token', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      Boom.create.mockImplementation((status, message) => ({ status, message }));

      expect(() => securityHelper.verifyJWT('invalid_token', 'secret')).toThrow();
      expect(Boom.create).toHaveBeenCalledWith(401, 'error.invalid_token', expect.any(Object));
    });

    it('should throw a Boom error for an expired token', () => {
      const error = new Error('Expired token');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date();
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      Boom.create.mockImplementation((status, message) => ({ status, message }));

      expect(() => securityHelper.verifyJWT('expired_token', 'secret')).toThrow();
      expect(Boom.create).toHaveBeenCalledWith(401, 'error.expired_token', expect.any(Object));
    });

    it('should throw a Boom error for a not-yet-active token', () => {
      const error = new Error('Not active');
      error.name = 'NotBeforeError';
      error.date = new Date();
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      Boom.create.mockImplementation((status, message) => ({ status, message }));

      expect(() => securityHelper.verifyJWT('not_active_token', 'secret')).toThrow();
      expect(Boom.create).toHaveBeenCalledWith(401, 'error.token_not_active', expect.any(Object));
    });

    it('should throw a generic internal Boom error for other failures', () => {
      const error = new Error('Something else failed');
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      Boom.internal.mockImplementation((message) => ({ message }));

      expect(() => securityHelper.verifyJWT('any_token', 'secret')).toThrow();
      expect(Boom.internal).toHaveBeenCalledWith('error.token_verification_failed', expect.any(Object));
    });
  });

  // =======================================================================
  //  SECURITY MONITORING
  // =======================================================================

  describe('logSecurityEvent', () => {
    it('should log a security event to Redis', async () => {
      crypto.randomBytes.mockReturnValue(Buffer.from('securetokenid'));
      cacheHelper.set.mockResolvedValue('OK');
      cacheHelper.lPush.mockResolvedValue(1);
      cacheHelper.lTrim.mockResolvedValue('OK');

      const eventId = await securityHelper.logSecurityEvent(
        'test_event',
        { ipAddress: '127.0.0.1' },
        THREAT_LEVELS.LOW
      );

      expect(eventId).toBe('736563757265746f6b656e6964'); // hex of 'securetokenid'
      expect(cacheHelper.set).toHaveBeenCalledWith(`security_event:${eventId}`, expect.any(Object), 24 * 60 * 60);
      expect(cacheHelper.lPush).toHaveBeenCalledWith('security_events', eventId);
      expect(cacheHelper.lTrim).toHaveBeenCalledWith('security_events', 0, 999);
    });

    it('should return null if logging fails', async () => {
      cacheHelper.set.mockRejectedValue(new Error('Redis error'));
      console.error = jest.fn(); // Suppress console error
      const eventId = await securityHelper.logSecurityEvent('test_event');
      expect(eventId).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSecurityEvents', () => {
    it('should retrieve and filter security events', async () => {
      const event1 = { id: '1', event: 'LOGIN_FAILURE', level: 'HIGH', timestamp: 2 };
      const event2 = { id: '2', event: 'CSRF_DETECTED', level: 'MEDIUM', timestamp: 1 };
      cacheHelper.lRange.mockResolvedValue(['1', '2']);
      cacheHelper.get.mockImplementation((key) => {
        if (key === 'security_event:1') return Promise.resolve(event1);
        if (key === 'security_event:2') return Promise.resolve(event2);
        return Promise.resolve(null);
      });

      const events = await securityHelper.getSecurityEvents({ level: 'HIGH' });
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event1);
    });

    it('should return an empty array on failure', async () => {
      cacheHelper.lRange.mockRejectedValue(new Error('Redis error'));
      console.error = jest.fn();
      const events = await securityHelper.getSecurityEvents();
      expect(events).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // =======================================================================
  //  IP SECURITY
  // =======================================================================

  describe('markSuspiciousIP', () => {
    it('should mark a new IP as suspicious', async () => {
      cacheHelper.get.mockResolvedValue(null);
      cacheHelper.set.mockResolvedValue('OK');

      const result = await securityHelper.markSuspiciousIP('127.0.0.1', 'test', THREAT_LEVELS.MEDIUM);

      expect(result).toBe(true);
      expect(cacheHelper.set).toHaveBeenCalledWith(
        'suspicious_ip:127.0.0.1',
        expect.objectContaining({ totalIncidents: 1 }),
        expect.any(Number)
      );
    });

    it('should auto-block an IP on CRITICAL severity', async () => {
      cacheHelper.get.mockResolvedValue(null);
      cacheHelper.set.mockResolvedValue('OK');

      await securityHelper.markSuspiciousIP('127.0.0.1', 'critical issue', THREAT_LEVELS.CRITICAL);

      expect(cacheHelper.set).toHaveBeenCalledWith(
        'suspicious_ip:127.0.0.1',
        expect.objectContaining({ blockedUntil: expect.any(Number) }),
        expect.any(Number)
      );
    });

    it('should return false on failure', async () => {
      cacheHelper.get.mockRejectedValue(new Error('Redis error'));
      console.error = jest.fn();
      const result = await securityHelper.markSuspiciousIP('127.0.0.1', 'reason');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('checkIPStatus', () => {
    it('should return clean status for an unknown IP', async () => {
      cacheHelper.get.mockResolvedValue(null);
      const status = await securityHelper.checkIPStatus('127.0.0.1');
      expect(status).toEqual({
        isBlocked: false,
        isSuspicious: false,
        blockedUntil: null,
        incidentCount: 0,
      });
    });

    it('should return blocked status for a blocked IP', async () => {
      const now = 1678886400000;
      const ipData = {
        incidents: [{ reason: 'test' }],
        totalIncidents: 1,
        blockedUntil: now + 10000,
      };
      cacheHelper.get.mockResolvedValue(ipData);

      const status = await securityHelper.checkIPStatus('127.0.0.1');
      expect(status.isBlocked).toBe(true);
      expect(status.isSuspicious).toBe(true);
    });

    it('should return suspicious status for an IP with expired block', async () => {
      const now = 1678886400000;
      const ipData = {
        incidents: [{ reason: 'test' }],
        totalIncidents: 1,
        blockedUntil: now - 10000, // Block expired
      };
      cacheHelper.get.mockResolvedValue(ipData);

      const status = await securityHelper.checkIPStatus('127.0.0.1');
      expect(status.isBlocked).toBe(false);
      expect(status.isSuspicious).toBe(true);
    });
  });
});
