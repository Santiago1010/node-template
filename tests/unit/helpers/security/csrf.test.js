const { generateCSRFToken, validateCSRFToken } = require('../../../../helpers/security.helper');
const contextHelper = require('../../../../helpers/context.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - CSRF Protection', () => {
  const sessionId = 'test-session-id';

  beforeEach(() => {
    contextHelper.getCurrentSessionId.mockReturnValue(sessionId);
  });

  describe('generateCSRFToken and validateCSRFToken', () => {
    test('should generate and validate a CSRF token successfully', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      const isValid = validateCSRFToken(token);
      expect(isValid).toBe(true);
    });

    test('should invalidate a used token', () => {
      const token = generateCSRFToken();
      validateCSRFToken(token); // First use
      const isSecondUseValid = validateCSRFToken(token);
      expect(isSecondUseValid).toBe(false);
    });
  });
});
