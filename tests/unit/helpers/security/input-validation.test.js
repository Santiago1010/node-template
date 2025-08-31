const { validateAndSanitizeString } = require('../../../../helpers/security.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - Input Validation', () => {
  describe('validateAndSanitizeString', () => {
    test('should return a valid result for a clean string', () => {
      const result = validateAndSanitizeString('hello world');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('hello world');
      expect(result.errors).toEqual([]);
    });

    test('should invalidate a string with malicious script', () => {
      const result = validateAndSanitizeString('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Potentially malicious script detected');
    });
  });
});
