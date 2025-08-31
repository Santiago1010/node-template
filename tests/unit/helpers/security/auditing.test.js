const { logSecurityEvent, getSecurityEvents, getSecurityStats } = require('../../../../helpers/security.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - Auditing and Monitoring', () => {
  beforeAll(() => {
    logSecurityEvent('TEST_EVENT', { data: 'test' });
  });

  describe('getSecurityEvents', () => {
    test('should retrieve recent security events', () => {
      const events = getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe('TEST_EVENT');
    });
  });

  describe('getSecurityStats', () => {
    test('should return a summary of security statistics', () => {
      const stats = getSecurityStats();
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.eventsByType.TEST).toBe(1);
    });
  });
});
