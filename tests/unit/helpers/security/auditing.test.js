const securityHelper = require('../../../../helpers/security.helper');
const { THREAT_LEVELS } = require('../../../../helpers/constants.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

// Mock the entire security.helper module to control its internal state and functions
jest.mock('../../../../helpers/security.helper', () => {
  const originalModule = jest.requireActual('../../../../helpers/security.helper');
  const securityStorage = {
    rateLimits: new Map(),
    csrfTokens: new Map(),
    suspiciousIPs: new Map(),
    securityEvents: [],
    loginAttempts: new Map(),
  };

  return {
    __esModule: true,
    ...originalModule,
    // Override functions that interact with securityStorage
    logSecurityEvent: jest.fn((event, details = {}, level = 'low') => {
      const securityEvent = {
        id: originalModule.generateSecureToken(16),
        event,
        level,
        timestamp: originalModule.getCurrentTimestamp(),
        userAgent: originalModule.contextHelper.getCurrentUserAgent(),
        ipAddress: originalModule.contextHelper.getCurrentIpAddress(),
        userId: originalModule.contextHelper.getCurrentUserId(),
        sessionId: originalModule.contextHelper.getCurrentSessionId(),
        details: originalModule.securityHelper.sanitizeLogData(details),
      };

      securityStorage.securityEvents.push(securityEvent);

      if (securityStorage.securityEvents.length > 1000) {
        securityStorage.securityEvents = securityStorage.securityEvents.slice(-1000);
      }

      originalModule.contextHelper.setCustomData('lastSecurityEvent', securityEvent);

      return securityEvent.id;
    }),
    getSecurityEvents: jest.fn((filters = {}) => {
      const {
        level = null,
        eventType = null,
        timeRange = 24 * 60 * 60 * 1000, // 24 hours
        limit = 100,
      } = filters;

      const now = originalModule.getCurrentTimestamp();
      const cutoff = now - timeRange;

      let events = securityStorage.securityEvents.filter((event) => event.timestamp > cutoff);

      if (level) {
        events = events.filter((event) => event.level === level);
      }

      if (eventType) {
        events = events.filter((event) => event.event.includes(eventType.toUpperCase()));
      }

      return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }),
    getSecurityStats: jest.fn((timeRange = 24 * 60 * 60 * 1000) => {
      const events = originalModule.securityHelper.getSecurityEvents({ timeRange, limit: 10000 });

      const stats = {
        totalEvents: events.length,
        eventsByLevel: {
          [THREAT_LEVELS.LOW]: 0,
          [THREAT_LEVELS.MEDIUM]: 0,
          [THREAT_LEVELS.HIGH]: 0,
          [THREAT_LEVELS.CRITICAL]: 0,
        },
        eventsByType: {},
        uniqueIPs: new Set(),
        suspiciousIPs: securityStorage.suspiciousIPs.size,
        activeRateLimits: securityStorage.rateLimits.size,
        activeSessions: 0,
      };

      events.forEach((event) => {
        stats.eventsByLevel[event.level]++;

        const eventType = event.event.split('_')[0];
        stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + 1;

        if (event.ipAddress) {
          stats.uniqueIPs.add(event.ipAddress);
        }
      });

      stats.uniqueIPs = stats.uniqueIPs.size;

      return stats;
    }),
    // Expose a way to reset the internal storage for testing
    __test__resetSecurityStorage: () => {
      securityStorage.rateLimits = new Map();
      securityStorage.csrfTokens = new Map();
      securityStorage.suspiciousIPs = new Map();
      securityStorage.securityEvents = [];
      securityStorage.loginAttempts = new Map();
    },
  };
});

describe('Security Helper - Auditing and Monitoring', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset securityStorage before each test to ensure isolation
    securityHelper.__test__resetSecurityStorage();
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  describe('logSecurityEvent', () => {
    test('should log a security event with default level', () => {
      securityHelper.logSecurityEvent('TEST_EVENT_DEFAULT', { data: 'some-data' });
      const events = securityHelper.getSecurityEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('TEST_EVENT_DEFAULT');
      expect(events[0].level).toBe(THREAT_LEVELS.LOW);
      expect(events[0].details).toEqual({ data: 'some-data' });
      expect(events[0].userAgent).toBe('test-agent');
      expect(events[0].ipAddress).toBe('127.0.0.1');
      expect(events[0].userId).toBe('test-user');
    });

    test('should log a security event with specified level', () => {
      securityHelper.logSecurityEvent('TEST_EVENT_HIGH', { data: 'critical' }, THREAT_LEVELS.HIGH);
      const events = securityHelper.getSecurityEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('TEST_EVENT_HIGH');
      expect(events[0].level).toBe(THREAT_LEVELS.HIGH);
    });

    test('should limit the number of stored security events', () => {
      for (let i = 0; i < 1005; i++) {
        securityHelper.logSecurityEvent(`EVENT_${i}`);
      }
      const events = securityHelper.getSecurityEvents();
      expect(events.length).toBe(1000);
      expect(events[0].event).toBe('EVENT_5'); // Should contain the latest 1000 events
      expect(events[999].event).toBe('EVENT_1004');
    });

    test('should call console.error if logging fails (e.g., token generation error)', () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      jest.spyOn(global.console, 'error').mockImplementation(() => {}); // Spy on global console.error
      jest.spyOn(require('../../../../helpers/security.helper'), 'generateSecureToken').mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      securityHelper.logSecurityEvent('FAIL_EVENT');
      expect(console.error).toHaveBeenCalledWith('Failed to log security event:', expect.any(Error));
    });
  });

  describe('sanitizeLogData', () => {
    test('should sanitize string by replacing newlines, tabs and truncating', () => {
      const input = 'Line1\nLine2\tLine3';
      const sanitized = securityHelper.sanitizeLogData(input);
      expect(sanitized).toBe('Line1 Line2 Line3');

      const longInput = 'a'.repeat(600);
      const truncated = securityHelper.sanitizeLogData(longInput);
      expect(truncated.length).toBe(500);
      expect(truncated).toBe('a'.repeat(500));
    });

    test('should sanitize nested objects recursively', () => {
      const input = {
        field1: 'value1\n',
        field2: {
          nested1: 'nestedValue1\t',
          nested2: 'b'.repeat(600),
        },
        field3: 123,
        field4: null,
        field5: undefined,
      };
      const sanitized = securityHelper.sanitizeLogData(input);
      expect(sanitized).toEqual({
        field1: 'value1 ',
        field2: {
          nested1: 'nestedValue1 ',
          nested2: 'b'.repeat(500),
        },
        field3: 123,
        field4: null,
        field5: undefined,
      });
    });

    test('should return non-string/non-object data as is', () => {
      expect(securityHelper.sanitizeLogData(123)).toBe(123);
      expect(securityHelper.sanitizeLogData(true)).toBe(true);
      expect(securityHelper.sanitizeLogData(null)).toBe(null);
      expect(securityHelper.sanitizeLogData(undefined)).toBe(undefined);
    });
  });

  describe('getSecurityEvents', () => {
    test('should retrieve recent security events', () => {
      securityHelper.logSecurityEvent('EVENT_RECENT');
      const events = securityHelper.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe('EVENT_RECENT');
    });

    test('should filter events by level', () => {
      securityHelper.logSecurityEvent('EVENT_LOW', {}, THREAT_LEVELS.LOW);
      securityHelper.logSecurityEvent('EVENT_HIGH', {}, THREAT_LEVELS.HIGH);
      const lowEvents = securityHelper.getSecurityEvents({ level: THREAT_LEVELS.LOW });
      expect(lowEvents.length).toBe(1);
      expect(lowEvents[0].event).toBe('EVENT_LOW');
    });

    test('should filter events by eventType', () => {
      securityHelper.logSecurityEvent('LOGIN_SUCCESS');
      securityHelper.logSecurityEvent('LOGOUT_FAILURE');
      const loginEvents = securityHelper.getSecurityEvents({ eventType: 'LOGIN' });
      expect(loginEvents.length).toBe(1);
      expect(loginEvents[0].event).toBe('LOGIN_SUCCESS');
    });

    test('should filter events by timeRange', () => {
      const securityHelper = require('../../../../helpers/security.helper');
      const originalGetCurrentTimestamp = securityHelper.getCurrentTimestamp;

      // Mock time to be in the past for some events
      jest.spyOn(securityHelper, 'getCurrentTimestamp').mockReturnValue(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      securityHelper.logSecurityEvent('OLD_EVENT');

      // Reset mock to current time
      securityHelper.getCurrentTimestamp.mockRestore();
      securityHelper.logSecurityEvent('NEW_EVENT');

      const recentEvents = securityHelper.getSecurityEvents({ timeRange: 1 * 24 * 60 * 60 * 1000 }); // Last 1 day
      expect(recentEvents.length).toBe(1);
      expect(recentEvents[0].event).toBe('NEW_EVENT');

      securityHelper.getCurrentTimestamp = originalGetCurrentTimestamp;
    });

    test('should limit the number of returned events', () => {
      for (let i = 0; i < 5; i++) {
        securityHelper.logSecurityEvent(`LIMITED_EVENT_${i}`);
      }
      const events = securityHelper.getSecurityEvents({ limit: 2 });
      expect(events.length).toBe(2);
      expect(events[0].event).toBe('LIMITED_EVENT_4');
      expect(events[1].event).toBe('LIMITED_EVENT_3');
    });

    test('should return empty array if getting security events fails', () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      jest.spyOn(global.console, 'error').mockImplementation(() => {}); // Spy on global console.error
      jest.spyOn(require('../../../../helpers/security.helper'), 'getCurrentTimestamp').mockImplementation(() => {
        throw new Error('Timestamp error');
      });

      const events = securityHelper.getSecurityEvents();
      expect(events).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to get security events:', expect.any(Error));
    });
  });

  describe('getSecurityStats', () => {
    test('should return a summary of security statistics', () => {
      securityHelper.logSecurityEvent('LOGIN_SUCCESS', {}, THREAT_LEVELS.LOW);
      securityHelper.logSecurityEvent('SQL_INJECTION_ATTEMPT', {}, THREAT_LEVELS.CRITICAL);
      securityHelper.logSecurityEvent('LOGIN_FAILURE', {}, THREAT_LEVELS.MEDIUM);

      const stats = securityHelper.getSecurityStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByLevel[THREAT_LEVELS.LOW]).toBe(1);
      expect(stats.eventsByLevel[THREAT_LEVELS.MEDIUM]).toBe(1);
      expect(stats.eventsByLevel[THREAT_LEVELS.HIGH]).toBe(0);
      expect(stats.eventsByLevel[THREAT_LEVELS.CRITICAL]).toBe(1);
      expect(stats.eventsByType.LOGIN).toBe(2);
      expect(stats.eventsByType.SQL).toBe(1);
      expect(stats.uniqueIPs).toBe(1); // All from 127.0.0.1
      expect(stats.suspiciousIPs).toBe(0); // No IPs marked suspicious via markSuspiciousIP
      expect(stats.activeRateLimits).toBe(0); // No active rate limits
    });

    test('should return error object if getting security stats fails', () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      jest.spyOn(global.console, 'error').mockImplementation(() => {}); // Spy on global console.error
      jest.spyOn(require('../../../../helpers/security.helper'), 'getSecurityEvents').mockImplementation(() => {
        throw new Error('Events error');
      });

      const stats = securityHelper.getSecurityStats();
      expect(stats.error).toBe('Statistics unavailable');
      expect(console.error).toHaveBeenCalledWith('Failed to get security stats:', expect.any(Error));
    });
  });
});
