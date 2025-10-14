// =============================================================================
// SECURITY HELPER - UNIT TESTS
// =============================================================================

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const sanitize = require('sanitize-html');
const securityHelper = require('../../../../helpers/security.helper');
const config = require('../../../../config/env');
const { SECURITY_CONFIG } = require('../../../../utils/constants.util');

// Mock dependencies
jest.mock('crypto');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('moment');
jest.mock('sanitize-html');
jest.mock('../../../../config/env', () => ({
  jwt: {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'test-issuer',
    audience: 'test-audience',
  },
}));
jest.mock('../../../../config/i18n', () => ({
  __: jest.fn((key) => key),
}));
jest.mock('../../../../utils/constants.util', () => ({
  SECURITY_CONFIG: {
    PASSWORD_POLICY: {
      SALT: 10,
    },
  },
}));

describe('Security Helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecureToken', () => {
    it('should generate a random token of default length', () => {
      const mockBuffer = Buffer.from('random-bytes');
      crypto.randomBytes.mockReturnValue(mockBuffer);
      const token = securityHelper.generateSecureToken();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe(mockBuffer.toString('hex'));
    });

    it('should generate a random token of specified length', () => {
      const mockBuffer = Buffer.from('short-random-bytes');
      crypto.randomBytes.mockReturnValue(mockBuffer);
      const token = securityHelper.generateSecureToken(16);
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(token).toBe(mockBuffer.toString('hex'));
    });

    it('should throw an error if crypto fails', () => {
      const errorMessage = 'Crypto error';
      crypto.randomBytes.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      expect(() => securityHelper.generateSecureToken()).toThrow(errorMessage);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return the current timestamp in milliseconds', () => {
      const mockTimestamp = 1672531200000;
      const momentInstance = { valueOf: jest.fn().mockReturnValue(mockTimestamp) };
      moment.mockReturnValue(momentInstance);
      const timestamp = securityHelper.getCurrentTimestamp();
      expect(timestamp).toBe(mockTimestamp);
      expect(moment).toHaveBeenCalled();
      expect(momentInstance.valueOf).toHaveBeenCalled();
    });
  });

  describe('sanitizeHTML', () => {
    it('should sanitize HTML with default options', () => {
      const dirtyHtml = '<script>alert("xss")</script><p>Hello</p>';
      const cleanHtml = '<p>Hello</p>';
      sanitize.mockReturnValue(cleanHtml);
      const result = securityHelper.sanitizeHTML(dirtyHtml);
      expect(sanitize).toHaveBeenCalledWith(dirtyHtml, expect.any(Object));
      expect(result).toBe(cleanHtml);
    });

    it('should sanitize HTML with custom options', () => {
      const dirtyHtml = '<b>Bold</b> and <i>italic</i>';
      const cleanHtml = '<b>Bold</b>';
      const customOptions = { allowedTags: ['b'] };
      sanitize.mockReturnValue(cleanHtml);
      const result = securityHelper.sanitizeHTML(dirtyHtml, customOptions);
      const expectedOptions = {
        ...{
          allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          allowedAttributes: {
            '*': ['class', 'style'],
          },
          allowedIframeHostnames: [],
          disallowedTagsMode: 'discard',
        },
        ...customOptions,
      };
      expect(sanitize).toHaveBeenCalledWith(dirtyHtml, expectedOptions);
      expect(result).toBe(cleanHtml);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      const result = await securityHelper.hashPassword(password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, SECURITY_CONFIG.PASSWORD_POLICY.SALT);
      expect(result).toBe(hashedPassword);
    });

    it('should throw an error for an empty password', async () => {
      await expect(securityHelper.hashPassword('')).rejects.toThrow('Hashing requires a non-empty string password');
    });

    it('should throw an error for invalid salt rounds', async () => {
      await expect(securityHelper.hashPassword('password', 0)).rejects.toThrow('Invalid salt rounds parameter');
    });

    it('should throw an error if bcrypt fails', async () => {
      const errorMessage = 'bcrypt error';
      bcrypt.hash.mockRejectedValue(new Error(errorMessage));
      await expect(securityHelper.hashPassword('password')).rejects.toThrow(`Hashing failed due to: ${errorMessage}`);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for a matching password', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const result = await securityHelper.verifyPassword('password123', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for a non-matching password', async () => {
      bcrypt.compare.mockResolvedValue(false);
      const result = await securityHelper.verifyPassword('wrongpassword', 'hashedPassword');
      expect(result).toBe(false);
    });

    it('should throw an error for empty inputs', async () => {
      await expect(securityHelper.verifyPassword('', 'hash')).rejects.toThrow(
        'Verification requires a non-empty string password and hash'
      );
      await expect(securityHelper.verifyPassword('pass', '')).rejects.toThrow(
        'Verification requires a non-empty string password and hash'
      );
    });

    it('should throw an error if bcrypt.compare fails', async () => {
      const errorMessage = 'bcrypt error';
      bcrypt.compare.mockRejectedValue(new Error(errorMessage));
      await expect(securityHelper.verifyPassword('password', 'hash')).rejects.toThrow(
        `Verification failed due to: ${errorMessage}`
      );
    });
  });

  describe('createJWT', () => {
    it('should create a JWT with default options', () => {
      const payload = { userId: 1 };
      const secret = 'supersecret';
      const token = 'signed.jwt.token';
      const mockBuffer = Buffer.from('random-jwt-id');
      crypto.randomBytes.mockReturnValue(mockBuffer);
      jwt.sign.mockReturnValue(token);

      const result = securityHelper.createJWT(payload, secret);

      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, {
        algorithm: config.jwt.algorithm,
        expiresIn: config.jwt.expiresIn,
        notBefore: '0s',
        issuer: config.url,
        audience: undefined,
        jwtid: crypto.randomBytes(16).toString('hex'),
      });
      expect(result).toBe(token);
    });

    it('should create a JWT with custom options', () => {
      const payload = { userId: 1 };
      const secret = 'supersecret';
      const token = 'signed.jwt.token';
      const customOptions = { expiresIn: '15m' };
      const mockBuffer = Buffer.from('random-jwt-id');
      crypto.randomBytes.mockReturnValue(mockBuffer);
      jwt.sign.mockReturnValue(token);

      const result = securityHelper.createJWT(payload, secret, customOptions);

      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, expect.objectContaining(customOptions));
      expect(result).toBe(token);
    });
  });

  describe('verifyJWT', () => {
    const token = 'valid.jwt.token';
    const secret = 'supersecret';
    const decodedPayload = { userId: 1 };

    it('should verify a valid token and return the payload', () => {
      jwt.verify.mockReturnValue(decodedPayload);
      const result = securityHelper.verifyJWT(token, secret);
      expect(jwt.verify).toHaveBeenCalledWith(token, secret, expect.any(Object));
      expect(result).toEqual(decodedPayload);
    });

    it('should throw an error for an invalid signature (JsonWebTokenError)', () => {
      const error = new Error('Invalid signature');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => securityHelper.verifyJWT(token, secret)).toThrow();
    });

    it('should throw an error for an expired token (TokenExpiredError)', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date();
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => securityHelper.verifyJWT(token, secret)).toThrow();
    });

    it('should throw an error for a not-yet-active token (NotBeforeError)', () => {
      const error = new Error('Token not active');
      error.name = 'NotBeforeError';
      error.date = new Date();
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => securityHelper.verifyJWT(token, secret)).toThrow();
    });

    it('should throw an error for other verification failures', () => {
      const error = new Error('Some other error');
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => securityHelper.verifyJWT(token, secret)).toThrow();
    });

    it('should use a custom HTTP error code if provided', () => {
      const error = new Error('Invalid signature');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => securityHelper.verifyJWT(token, secret, {}, 403)).toThrow();
    });
  });
});
