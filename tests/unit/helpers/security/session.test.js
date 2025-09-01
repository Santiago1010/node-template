const { validateSessionSecurity, createSecureSession } = require('../../../../helpers/security.helper');
const contextHelper = require('../../../../helpers/context.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  hasContext: jest.fn(() => true),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - Session Security', () => {
  const userId = 'user-123';

  describe('createSecureSession', () => {
    test('should create a secure session object', () => {
      contextHelper.getCurrentSessionId.mockReturnValue('new-session-id');
      const session = createSecureSession(userId);
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('userId', userId);
      expect(session).toHaveProperty('createdAt');
    });
  });

  describe('validateSessionSecurity', () => {
    test('should validate a fresh, secure session', () => {
      const session = {
        createdAt: Date.now(),
        lastActivity: Date.now(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };
      contextHelper.getCurrentIpAddress.mockReturnValue('127.0.0.1');
      contextHelper.getCurrentUserAgent.mockReturnValue('test-agent');

      const result = validateSessionSecurity(session);
      expect(result.isValid).toBe(true);
    });
  });
});
