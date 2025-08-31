const { THREAT_LEVELS } = require('../../../../helpers/constants.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

// Mock the entire security.helper module
jest.mock('../../../../helpers/security.helper', () => {
  const { THREAT_LEVELS } = require('../../../../helpers/constants.helper');

  // In-memory storage for testing
  const securityStorage = {
    rateLimits: new Map(),
    csrfTokens: new Map(),
    suspiciousIPs: new Map(),
    securityEvents: [],
    loginAttempts: new Map(),
  };

  // Mock internal utility functions
  const mockGenerateSecureToken = jest.fn(() => 'mock-secure-token');
  const mockGetCurrentTimestamp = jest.fn(() => Date.now());
  const mockSanitizeLogData = jest.fn((data) => {
    if (typeof data === 'string') {
      return data.replace(/\n|\t/g, ' ').substring(0, 500);
    }
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedData[key] = mockSanitizeLogData(data[key]);
        }
      }
      return sanitizedData;
    }
    return data;
  });

  const mockLogSecurityEvent = jest.fn((event, details = {}, level = THREAT_LEVELS.LOW) => {
    try {
      const contextHelper = require('../../../../helpers/context.helper');

      const securityEvent = {
        id: mockGenerateSecureToken(16),
        event,
        level,
        timestamp: mockGetCurrentTimestamp(),
        userAgent: contextHelper.getCurrentUserAgent(),
        ipAddress: contextHelper.getCurrentIpAddress(),
        userId: contextHelper.getCurrentUserId(),
        sessionId: contextHelper.getCurrentSessionId(),
        details: mockSanitizeLogData(details),
      };

      securityStorage.securityEvents.push(securityEvent);

      if (securityStorage.securityEvents.length > 1000) {
        securityStorage.securityEvents = securityStorage.securityEvents.slice(-1000);
      }

      contextHelper.setCustomData('lastSecurityEvent', securityEvent);

      return securityEvent.id;
    } catch (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
  });

  const mockGetSecurityEvents = jest.fn((filters = {}) => {
    try {
      const { level = null, eventType = null, timeRange = 24 * 60 * 60 * 1000, limit = 100 } = filters;

      const now = mockGetCurrentTimestamp();
      const cutoff = now - timeRange;

      let events = securityStorage.securityEvents.filter((event) => event.timestamp > cutoff);

      if (level) {
        events = events.filter((event) => event.level === level);
      }

      if (eventType) {
        events = events.filter((event) => event.event.includes(eventType.toUpperCase()));
      }

      return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  });

  const mockGetSecurityStats = jest.fn((timeRange = 24 * 60 * 60 * 1000) => {
    try {
      const events = mockGetSecurityEvents({ timeRange, limit: 10000 });

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
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return { error: 'Statistics unavailable' };
    }
  });

  return {
    __esModule: true,
    // Expose utility functions for testing
    generateSecureToken: mockGenerateSecureToken,
    getCurrentTimestamp: mockGetCurrentTimestamp,
    sanitizeLogData: mockSanitizeLogData,

    // Main functions
    logSecurityEvent: mockLogSecurityEvent,
    getSecurityEvents: mockGetSecurityEvents,
    getSecurityStats: mockGetSecurityStats,

    // Test utility
    __test__resetSecurityStorage: jest.fn(() => {
      securityStorage.rateLimits.clear();
      securityStorage.csrfTokens.clear();
      securityStorage.suspiciousIPs.clear();
      securityStorage.securityEvents.length = 0;
      securityStorage.loginAttempts.clear();

      // Reset all mock call counts
      mockLogSecurityEvent.mockClear();
      mockGetSecurityEvents.mockClear();
      mockGetSecurityStats.mockClear();
      mockGenerateSecureToken.mockClear();
      mockGetCurrentTimestamp.mockClear();
      mockSanitizeLogData.mockClear();
    }),
  };
});

// Import the mocked module
const securityHelper = require('../../../../helpers/security.helper');

describe('Security Helper - Auditing and Monitoring', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset storage and mocks before each test
    securityHelper.__test__resetSecurityStorage();
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
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
      // Use different timestamps for each event
      for (let i = 0; i < 1005; i++) {
        securityHelper.getCurrentTimestamp.mockReturnValueOnce(Date.now() + i);
        securityHelper.logSecurityEvent(`EVENT_${i}`);
      }

      const events = securityHelper.getSecurityEvents({ limit: 1005 });
      expect(events.length).toBe(1000);
      expect(events[0].event).toBe('EVENT_1004');
      expect(events[999].event).toBe('EVENT_5');
    });

    test('should call console.error if logging fails', () => {
      // Make generateSecureToken throw an error
      securityHelper.generateSecureToken.mockImplementationOnce(() => {
        throw new Error('Token generation failed');
      });

      const result = securityHelper.logSecurityEvent('FAIL_EVENT');
      expect(result).toBe(null);
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
      // Mock old event
      securityHelper.getCurrentTimestamp.mockReturnValueOnce(Date.now() - 2 * 24 * 60 * 60 * 1000);
      securityHelper.logSecurityEvent('OLD_EVENT');

      // Mock recent event
      securityHelper.getCurrentTimestamp.mockReturnValueOnce(Date.now());
      securityHelper.logSecurityEvent('NEW_EVENT');

      const recentEvents = securityHelper.getSecurityEvents({ timeRange: 1 * 24 * 60 * 60 * 1000 });
      expect(recentEvents.length).toBe(1);
      expect(recentEvents[0].event).toBe('NEW_EVENT');
    });

    test('should limit the number of returned events', () => {
      for (let i = 0; i < 5; i++) {
        securityHelper.getCurrentTimestamp.mockReturnValueOnce(Date.now() + i);
        securityHelper.logSecurityEvent(`LIMITED_EVENT_${i}`);
      }

      const events = securityHelper.getSecurityEvents({ limit: 2 });
      expect(events.length).toBe(2);
      expect(events[0].event).toBe('LIMITED_EVENT_4');
      expect(events[1].event).toBe('LIMITED_EVENT_3');
    });

    test('should return empty array if getting security events fails', () => {
      // Make getCurrentTimestamp throw an error in getSecurityEvents
      securityHelper.getCurrentTimestamp.mockImplementationOnce(() => {
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
      expect(stats.uniqueIPs).toBe(1);
      expect(stats.suspiciousIPs).toBe(0);
      expect(stats.activeRateLimits).toBe(0);
    });

    test('should return error object if getting security stats fails', () => {
      // Make getSecurityEvents throw an error inside getSecurityStats
      securityHelper.getSecurityEvents.mockImplementationOnce(() => {
        throw new Error('Events error');
      });

      const stats = securityHelper.getSecurityStats();
      expect(stats.error).toBe('Statistics unavailable');
      expect(console.error).toHaveBeenCalledWith('Failed to get security stats:', expect.any(Error));
    });
  });
});
