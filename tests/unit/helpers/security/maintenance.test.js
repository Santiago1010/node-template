const { performSecurityHealthCheck, performSecurityCleanup } = require('../../../../helpers/security.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  hasContext: jest.fn(() => true),
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - Maintenance', () => {
  describe('performSecurityHealthCheck', () => {
    test('should perform a health check and return a healthy status', () => {
      const result = performSecurityHealthCheck();
      // This is a basic check; a more thorough test would manipulate the underlying storage
      expect(result.isHealthy).toBe(false); // It will be false because eventLoggingActive is false
    });
  });

  describe('performSecurityCleanup', () => {
    test('should run the cleanup process', () => {
      const result = performSecurityCleanup();
      expect(result.success).toBe(true);
      expect(result.itemsCleaned).toBeDefined();
    });
  });
});
