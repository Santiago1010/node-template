const { checkRateLimit, checkStrictRateLimit } = require('../../../../helpers/security.helper');

describe('Security Helper - Rate Limiting', () => {
  const identifier = 'test-user';

  beforeEach(() => {
    // NOTE: This is a simplified test. In a real scenario, you would mock the securityStorage or context.
  });

  describe('checkRateLimit', () => {
    test('should allow requests within the limit', () => {
      const result = checkRateLimit(identifier, { maxRequests: 5 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('checkStrictRateLimit', () => {
    test('should allow requests within the strict limit', () => {
      const result = checkStrictRateLimit(identifier);
      expect(result.allowed).toBe(true);
    });
  });
});
