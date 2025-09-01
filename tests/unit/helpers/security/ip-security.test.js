const { markSuspiciousIP, checkIPStatus } = require('../../../../helpers/security.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - IP Security', () => {
  const ipAddress = '192.168.1.100';

  describe('markSuspiciousIP and checkIPStatus', () => {
    test('should mark an IP as suspicious and then check its status', () => {
      markSuspiciousIP(ipAddress, 'test reason');
      const status = checkIPStatus(ipAddress);
      expect(status.isSuspicious).toBe(true);
      expect(status.isBlocked).toBe(false);
      expect(status.incidentCount).toBe(1);
    });
  });
});
