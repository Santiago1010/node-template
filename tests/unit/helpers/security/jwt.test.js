const { createJWT, verifyJWT } = require('../../../../helpers/security.helper');

// Mock i18n
jest.mock('../../../../config/i18n', () => ({
  __: jest.fn((key) => key),
}));

// Mock @hapi/boom
jest.mock('@hapi/boom', () => ({
  create: jest.fn((httpError, message) => {
    const error = new Error(message);
    error.data = httpError;
    error.output = { headers: {} };
    return error;
  }),
}));

// Mock http-errors
jest.mock('http-errors', () => jest.fn((message, options) => ({ message, options })));

describe('Security Helper - JWT Functions', () => {
  const payload = { userId: 'test-user' };
  const secret = 'super-secret-key';

  describe('createJWT and verifyJWT', () => {
    test('should create and verify a JWT successfully', () => {
      const token = createJWT(payload, secret, { expiresIn: '1h' });
      const decoded = verifyJWT(token, secret);
      expect(decoded.userId).toBe(payload.userId);
    });

    test('should throw an error for an invalid signature', () => {
      const token = createJWT(payload, secret);
      expect(() => {
        verifyJWT(token, 'wrong-secret');
      }).toThrow('error.invalid_token');
    });

    test('should throw an error for an expired token', async () => {
      const token = createJWT(payload, secret, { expiresIn: '-1s' });
      try {
        verifyJWT(token, secret);
      } catch (error) {
        expect(error.message).toBe('error.expired_token');
      }
    });
  });
});
