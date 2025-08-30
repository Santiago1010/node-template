// =============================================================================
// CONTEXT GETTERS - UNIT TESTS
// =============================================================================

const contextHelper = require('../../../../helpers/context.helper');
const asyncLocalStorage = require('../../../../config/context');
const { CONTEXT_KEYS } = require('../../../../helpers/constants.helper');

// Mock the asyncLocalStorage
jest.mock('../../../../config/context', () => ({
  getStore: jest.fn(),
}));

// Mock constants
jest.mock('../../../../helpers/constants.helper', () => ({
  CONTEXT_KEYS: {
    USER_ID: 'userId',
    USER_DATA: 'userData',
    SESSION_ID: 'sessionId',
    REQUEST_ID: 'requestId',
    IP_ADDRESS: 'ipAddress',
    USER_AGENT: 'userAgent',
    TIMESTAMP: 'timestamp',
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
    TENANT_ID: 'tenantId',
    CORRELATION_ID: 'correlationId',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Context Data Getters', () => {
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // Define a mock context store for tests
    mockStore = {
      [CONTEXT_KEYS.USER_ID]: 'user-123',
      [CONTEXT_KEYS.USER_DATA]: { name: 'John Doe', email: 'john.doe@example.com' },
      [CONTEXT_KEYS.SESSION_ID]: 'session-abc',
      [CONTEXT_KEYS.REQUEST_ID]: 'req-xyz',
      [CONTEXT_KEYS.IP_ADDRESS]: '127.0.0.1',
      [CONTEXT_KEYS.USER_AGENT]: 'Jest Test Runner',
      [CONTEXT_KEYS.TIMESTAMP]: '2025-08-30T12:00:00.000Z',
      [CONTEXT_KEYS.PERMISSIONS]: ['read', 'write'],
      [CONTEXT_KEYS.ROLES]: ['admin', 'editor'],
      [CONTEXT_KEYS.TENANT_ID]: 'tenant-456',
      [CONTEXT_KEYS.CORRELATION_ID]: 'corr-789',
    };
    asyncLocalStorage.getStore.mockReturnValue(mockStore);
  });

  describe('getContextValue', () => {
    it('should return the value for an existing key', () => {
      expect(contextHelper.getContextValue(CONTEXT_KEYS.USER_ID)).toBe('user-123');
    });

    it('should return the default value for a non-existing key', () => {
      expect(contextHelper.getContextValue('nonExistingKey', 'default')).toBe('default');
    });

    it('should return null for a non-existing key when no default is provided', () => {
      expect(contextHelper.getContextValue('nonExistingKey')).toBeNull();
    });

    it('should return the default value if the context does not exist', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      expect(contextHelper.getContextValue(CONTEXT_KEYS.USER_ID, 'default')).toBe('default');
    });
  });

  describe('getContextValues', () => {
    it('should return an object with the requested key-value pairs', () => {
      const keys = [CONTEXT_KEYS.USER_ID, CONTEXT_KEYS.SESSION_ID, 'nonExistingKey'];
      const values = contextHelper.getContextValues(keys);
      expect(values).toEqual({
        [CONTEXT_KEYS.USER_ID]: 'user-123',
        [CONTEXT_KEYS.SESSION_ID]: 'session-abc',
      });
    });

    it('should return an empty object if no keys are requested', () => {
      expect(contextHelper.getContextValues([])).toEqual({});
    });

    it('should return an empty object if the context does not exist', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      expect(contextHelper.getContextValues([CONTEXT_KEYS.USER_ID])).toEqual({});
    });
  });

  // Test suite for all specific getter functions
  describe('Specific Getters', () => {
    const testCases = [
      { func: contextHelper.getCurrentUserId, key: CONTEXT_KEYS.USER_ID, expected: 'user-123' },
      {
        func: contextHelper.getCurrentUserData,
        key: CONTEXT_KEYS.USER_DATA,
        expected: { name: 'John Doe', email: 'john.doe@example.com' },
      },
      { func: contextHelper.getCurrentSessionId, key: CONTEXT_KEYS.SESSION_ID, expected: 'session-abc' },
      { func: contextHelper.getCurrentRequestId, key: CONTEXT_KEYS.REQUEST_ID, expected: 'req-xyz' },
      { func: contextHelper.getCurrentIpAddress, key: CONTEXT_KEYS.IP_ADDRESS, expected: '127.0.0.1' },
      { func: contextHelper.getCurrentUserAgent, key: CONTEXT_KEYS.USER_AGENT, expected: 'Jest Test Runner' },
      { func: contextHelper.getCurrentTimestamp, key: CONTEXT_KEYS.TIMESTAMP, expected: '2025-08-30T12:00:00.000Z' },
      {
        func: contextHelper.getCurrentPermissions,
        key: CONTEXT_KEYS.PERMISSIONS,
        expected: ['read', 'write'],
        defaultValue: [],
      },
      { func: contextHelper.getCurrentRoles, key: CONTEXT_KEYS.ROLES, expected: ['admin', 'editor'], defaultValue: [] },
      { func: contextHelper.getCurrentTenantId, key: CONTEXT_KEYS.TENANT_ID, expected: 'tenant-456' },
      { func: contextHelper.getCurrentCorrelationId, key: CONTEXT_KEYS.CORRELATION_ID, expected: 'corr-789' },
    ];

    testCases.forEach(({ func, key, expected, defaultValue }) => {
      describe(func.name, () => {
        it(`should return the correct value for ${key}`, () => {
          expect(func()).toEqual(expected);
        });

        it('should return null (or default) if the key is not in the store', () => {
          delete mockStore[key];
          asyncLocalStorage.getStore.mockReturnValue(mockStore);
          expect(func()).toEqual(defaultValue !== undefined ? defaultValue : null);
        });

        it('should return null (or default) if the context does not exist', () => {
          asyncLocalStorage.getStore.mockReturnValue(undefined);
          expect(func()).toEqual(defaultValue !== undefined ? defaultValue : null);
        });
      });
    });
  });
});
