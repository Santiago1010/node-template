const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Boom = require('@hapi/boom');

// Mock all external dependencies before importing the module
jest.mock('crypto');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('moment');
jest.mock('@hapi/boom');
jest.mock('sanitize-html');
jest.mock('rate-limiter-flexible');
jest.mock('../../../../helpers/cache.helper');
jest.mock('../../../../config/env');
jest.mock('../../../../config/i18n');
jest.mock('../../../../helpers/constants.helper');
jest.mock('../../../../config/cache/redisClient');

// Import mocked dependencies
const sanitizeHtml = require('sanitize-html');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const cacheHelper = require('../../../../helpers/cache.helper');
const config = require('../../../../config/env');
const i18n = require('../../../../config/i18n');
const { THREAT_LEVELS, SECURITY_CONFIG } = require('../../../../helpers/constants.helper');
const { createLegacyClient } = require('../../../../config/cache/redisClient');

// Setup default mock implementations
beforeAll(() => {
  // Crypto mocks
  crypto.randomBytes = jest.fn();

  // Bcrypt mocks
  bcrypt.hash = jest.fn();
  bcrypt.compare = jest.fn();

  // JWT mocks
  jwt.sign = jest.fn();
  jwt.verify = jest.fn();

  // En la sección beforeAll(), reemplaza el mock de moment con:
  const mockMoment = {
    valueOf: jest.fn(() => 1640995200000),
    add: jest.fn(function (amount, _) {
      // Retornar un nuevo objeto que también tenga toDate
      return {
        toDate: jest.fn(() => new Date('2022-01-01T00:00:00.000Z')),
        valueOf: jest.fn(() => 1640995200000 + amount),
      };
    }),
    toISOString: jest.fn(() => '2022-01-01T00:00:00.000Z'),
    toDate: jest.fn(() => new Date('2022-01-01T00:00:00.000Z')),
  };
  moment.mockImplementation(() => mockMoment);

  // Boom mocks
  Boom.create = jest.fn();
  Boom.internal = jest.fn();

  sanitizeHtml.mockImplementation((html, _) => {
    if (html === '') return '';
    // Simular sanitización básica
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<img[^>]*>/gi, '');
  });

  // Store rate limiter instances for tracking
  const rateLimiterInstances = {};

  RateLimiterRedis.mockImplementation((config) => {
    const mockInstance = {
      consume: jest.fn(),
      delete: jest.fn(),
      keyPrefix: config.keyPrefix,
    };

    rateLimiterInstances[config.keyPrefix] = mockInstance;
    return mockInstance;
  });

  // Hacer disponible globalmente
  global.mockRateLimiters = {
    get general() {
      return rateLimiterInstances['rate_limit'];
    },
    get strict() {
      return rateLimiterInstances['strict_rate_limit'];
    },
    get login() {
      return rateLimiterInstances['login_rate_limit'];
    },
  };

  RateLimiterRedis.mockImplementation((config) => {
    if (config.keyPrefix === 'login_rate_limit') {
      return rateLimiterInstances.login;
    } else if (config.keyPrefix === 'strict_rate_limit') {
      return rateLimiterInstances.strict;
    }
    return rateLimiterInstances.general;
  });

  // Make instances available globally for tests
  global.mockRateLimiters = rateLimiterInstances;

  // Redis client mock
  const mockRedisClient = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
  };
  createLegacyClient.mockReturnValue(mockRedisClient);

  // Cache helper mocks
  cacheHelper.set = jest.fn();
  cacheHelper.get = jest.fn();
  cacheHelper.lPush = jest.fn();
  cacheHelper.lTrim = jest.fn();
  cacheHelper.lRange = jest.fn();

  // Config mocks
  config.jwt = {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'test-issuer',
    audience: 'test-audience',
  };

  // CORRECCIÓN 4: Mock de constants con valores por defecto
  THREAT_LEVELS.LOW = 'LOW';
  THREAT_LEVELS.MEDIUM = 'MEDIUM';
  THREAT_LEVELS.HIGH = 'HIGH';
  THREAT_LEVELS.CRITICAL = 'CRITICAL';

  SECURITY_CONFIG.PASSWORD_POLICY = { SALT: 12 };
  SECURITY_CONFIG.RATE_LIMIT = {
    DEFAULT_MAX_REQUESTS: 100,
    DEFAULT_WINDOW: 60000,
    STRICT_MAX_REQUESTS: 10,
    STRICT_WINDOW: 60000,
  };

  // i18n mocks
  i18n.__ = jest.fn((key) => key);
});

// Import the module after mocks are setup
const securityHelper = require('../../../../helpers/security.helper');

describe('Security Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock return values
    crypto.randomBytes.mockReturnValue(Buffer.from('abcdef1234567890', 'hex'));
    bcrypt.hash.mockResolvedValue('$2b$12$hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwt.token.here');
    jwt.verify.mockReturnValue({ userId: '123', exp: 1640999999 });

    // Reset rate limiter mocks
    if (global.mockRateLimiters) {
      if (global.mockRateLimiters.general) {
        global.mockRateLimiters.general.consume.mockReset();
        global.mockRateLimiters.general.delete.mockReset();
      }
      if (global.mockRateLimiters.strict) {
        global.mockRateLimiters.strict.consume.mockReset();
        global.mockRateLimiters.strict.delete.mockReset();
      }
      if (global.mockRateLimiters.login) {
        global.mockRateLimiters.login.consume.mockReset();
        global.mockRateLimiters.login.delete.mockReset();
      }
    }
  });

  // =============================================================================
  // UTILITY FUNCTIONS TESTS
  // =============================================================================
  describe('Utility Functions', () => {
    describe('generateSecureToken', () => {
      it('should generate secure token with default length', () => {
        crypto.randomBytes.mockReturnValue(Buffer.from('a'.repeat(64), 'hex'));

        const token = securityHelper.generateSecureToken();

        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(typeof token).toBe('string');
        expect(token).toHaveLength(64);
      });

      it('should generate secure token with custom length', () => {
        crypto.randomBytes.mockReturnValue(Buffer.from('b'.repeat(32), 'hex'));

        const token = securityHelper.generateSecureToken(16);

        expect(crypto.randomBytes).toHaveBeenCalledWith(16);
        expect(token).toHaveLength(32);
      });

      it('should throw error if crypto.randomBytes fails', () => {
        crypto.randomBytes.mockImplementation(() => {
          throw new Error('Random bytes generation failed');
        });

        expect(() => securityHelper.generateSecureToken()).toThrow('Random bytes generation failed');
      });
    });

    describe('getCurrentTimestamp', () => {
      it('should return current timestamp', () => {
        const timestamp = securityHelper.getCurrentTimestamp();

        expect(timestamp).toBe(1640995200000);
        expect(moment).toHaveBeenCalled();
      });
    });

    describe('sanitizeLogData', () => {
      it('should sanitize string data', () => {
        const input = 'Test\r\nstring\twith\ncontrol\rchars' + 'a'.repeat(500);
        const result = securityHelper.sanitizeLogData(input);

        expect(result).toBe('Test string with control chars' + 'a'.repeat(470));
        expect(result.length).toBe(500);
      });

      it('should sanitize object data recursively', () => {
        const input = {
          field1: 'value\rwith\ncontrol\tchars',
          field2: {
            nestedField: 'nested\tvalue\nwith\rchars',
          },
        };

        const result = securityHelper.sanitizeLogData(input);

        expect(result.field1).toBe('value with control chars');
        expect(result.field2.nestedField).toBe('nested value with chars');
      });

      it('should return non-string, non-object values as-is', () => {
        expect(securityHelper.sanitizeLogData(123)).toBe(123);
        expect(securityHelper.sanitizeLogData(null)).toBe(null);
        expect(securityHelper.sanitizeLogData(undefined)).toBe(undefined);
        expect(securityHelper.sanitizeLogData(true)).toBe(true);
      });

      // ✅ CORRECCIÓN 5: Test mejorado para manejar referencias circulares
      it('should handle circular references without infinite recursion', () => {
        const circularObj = { name: 'test' };
        circularObj.self = circularObj;

        // Debe manejar la referencia circular sin lanzar error
        expect(() => {
          securityHelper.sanitizeLogData({ valid: 'data', circular: circularObj });
        }).not.toThrow();
      });
    });

    describe('sanitizeHTML', () => {
      it('should sanitize HTML with default options', () => {
        const input = '<script>alert("xss")</script><p>Safe content</p>';

        const result = securityHelper.sanitizeHTML(input);

        expect(sanitizeHtml).toHaveBeenCalledWith(
          input,
          expect.objectContaining({
            allowedTags: expect.arrayContaining(['p', 'br', 'strong', 'em']),
            allowedAttributes: { '*': ['class', 'style'] },
            allowedIframeHostnames: [],
            disallowedTagsMode: 'discard',
          })
        );
        expect(result).toBe('<p>Safe content</p>');
      });

      it('should sanitize HTML with custom options', () => {
        const input = '<div class="test">Content</div>';
        const customOptions = { allowedTags: ['div'] };

        securityHelper.sanitizeHTML(input, customOptions);

        expect(sanitizeHtml).toHaveBeenCalledWith(
          input,
          expect.objectContaining({
            allowedTags: ['div'],
          })
        );
      });
    });
  });

  // =============================================================================
  // JWT FUNCTIONS TESTS
  // =============================================================================
  describe('JWT Functions', () => {
    describe('createJWT', () => {
      beforeEach(() => {
        crypto.randomBytes.mockReturnValue(Buffer.from('randomjwtid123456789abcdef', 'hex'));
      });

      it('should create JWT with default options', () => {
        const payload = { userId: '123', role: 'user' };
        const secret = 'test-secret';
        jwt.sign.mockReturnValue('signed.jwt.token');

        const result = securityHelper.createJWT(payload, secret);

        expect(jwt.sign).toHaveBeenCalledWith(
          payload,
          secret,
          expect.objectContaining({
            algorithm: 'HS256',
            expiresIn: '1h',
            issuer: 'test-issuer',
            audience: 'test-audience',
            jwtid: expect.any(String),
          })
        );
        expect(result).toBe('signed.jwt.token');
      });

      it('should create JWT with custom options', () => {
        const payload = { userId: '123' };
        const secret = 'test-secret';
        const customOptions = { expiresIn: '2h', algorithm: 'HS512' };
        jwt.sign.mockReturnValue('custom.jwt.token');

        const result = securityHelper.createJWT(payload, secret, customOptions);

        expect(jwt.sign).toHaveBeenCalledWith(
          payload,
          secret,
          expect.objectContaining({
            algorithm: 'HS512',
            expiresIn: '2h',
          })
        );
        expect(result).toBe('custom.jwt.token');
      });

      it('should throw error if JWT signing fails', () => {
        jwt.sign.mockImplementation(() => {
          throw new Error('JWT signing failed');
        });

        expect(() => securityHelper.createJWT({}, 'secret')).toThrow('JWT signing failed');
      });
    });

    describe('verifyJWT', () => {
      it('should verify valid JWT successfully', () => {
        const token = 'valid.jwt.token';
        const secret = 'test-secret';
        const decodedPayload = { userId: '123', exp: 1640999999 };
        jwt.verify.mockReturnValue(decodedPayload);

        const result = securityHelper.verifyJWT(token, secret);

        expect(jwt.verify).toHaveBeenCalledWith(
          token,
          secret,
          expect.objectContaining({
            algorithms: ['HS256'],
            clockTolerance: 60,
            issuer: 'test-issuer',
            audience: 'test-audience',
          })
        );
        expect(result).toBe(decodedPayload);
      });

      it('should throw Boom error for invalid token', () => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        jwt.verify.mockImplementation(() => {
          throw error;
        });

        const boomError = new Error('Invalid token boom error');
        Boom.create.mockReturnValue(boomError);

        expect(() => securityHelper.verifyJWT('invalid.token', 'secret')).toThrow();
        expect(Boom.create).toHaveBeenCalledWith(401, 'error.invalid_token', {
          scheme: 'Bearer',
          errorType: 'invalid_token',
        });
      });

      it('should throw Boom error for expired token', () => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        jwt.verify.mockImplementation(() => {
          throw error;
        });

        const boomError = new Error('Expired token boom error');
        Boom.create.mockReturnValue(boomError);

        expect(() => securityHelper.verifyJWT('expired.token', 'secret')).toThrow();
        expect(Boom.create).toHaveBeenCalledWith(401, 'error.expired_token', {
          scheme: 'Bearer',
          errorType: 'expired_token',
          expiredAt: error.expiredAt,
        });
      });

      it('should use custom HTTP error code', () => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        jwt.verify.mockImplementation(() => {
          throw error;
        });

        const boomError = new Error('Invalid token boom error');
        Boom.create.mockReturnValue(boomError);

        expect(() => securityHelper.verifyJWT('invalid.token', 'secret', {}, 403)).toThrow();
        expect(Boom.create).toHaveBeenCalledWith(403, 'error.invalid_token', expect.any(Object));
      });
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================
  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or null inputs gracefully', () => {
      expect(securityHelper.sanitizeLogData('')).toBe('');
      expect(securityHelper.sanitizeLogData(null)).toBe(null);
      expect(securityHelper.sanitizeLogData(undefined)).toBe(undefined);

      // ✅ CORRECCIÓN 7: Test más realista para sanitizeHTML con string vacío
      sanitizeHtml.mockReturnValueOnce(''); // Mock específico para este caso
      expect(securityHelper.sanitizeHTML('')).toBe('');

      expect(() => securityHelper.generateSecureToken(0)).not.toThrow();
    });
  });
});

// =============================================================================
// SETUP AND TEARDOWN - IMPROVED
// =============================================================================
afterEach(() => {
  jest.clearAllMocks();

  // Reset sanitizeHtml mock to default behavior
  sanitizeHtml.mockImplementation((html, _) => {
    if (html === '') return '';
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<img[^>]*>/gi, '');
  });
});

afterAll(() => {
  jest.resetAllMocks();
  jest.resetModules();
  jest.clearAllTimers();
  jest.useRealTimers();

  // Clean up global variables
  delete global.mockRateLimiters;
});
