// =============================================================================
// CONTEXT SETTERS - UNIT TESTS
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
    IP_ADDRESS: 'ipAddress',
    USER_AGENT: 'userAgent',
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
    TENANT_ID: 'tenantId',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Context Data Setters', () => {
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // Define a mock context store for tests
    mockStore = {};
    asyncLocalStorage.getStore.mockReturnValue(mockStore);
  });

  describe('setContextValue', () => {
    it('should set a value for a valid key', () => {
      const result = contextHelper.setContextValue(CONTEXT_KEYS.USER_ID, 'user-123');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.USER_ID]).toBe('user-123');
    });

    it('should sanitize the value before setting it', () => {
      const maliciousInput = '<script>malicious code</script>';
      contextHelper.setContextValue('custom_someKey', maliciousInput);
      expect(mockStore.custom_someKey).toBe('');
    });

    it('should throw an error for an invalid key', () => {
      // Assuming isValidContextKey logic is tested elsewhere and works
      // Here we simulate an invalid key by not including it in CONTEXT_KEYS
      expect(() => contextHelper.setContextValue('invalidKey', 'some-value')).toThrow(
        "Failed to set context value for key 'invalidKey': Invalid context key: invalidKey"
      );
    });

    it('should throw an error if no context is active', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      expect(() => contextHelper.setContextValue(CONTEXT_KEYS.USER_ID, 'user-123')).toThrow(
        "Failed to set context value for key 'userId': No active context found"
      );
    });
  });

  describe('setContextValues', () => {
    it('should set multiple key-value pairs', () => {
      const valuesToSet = {
        [CONTEXT_KEYS.USER_ID]: 'user-123',
        [CONTEXT_KEYS.SESSION_ID]: 'session-abc',
      };
      const result = contextHelper.setContextValues(valuesToSet);
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.USER_ID]).toBe('user-123');
      expect(mockStore[CONTEXT_KEYS.SESSION_ID]).toBe('session-abc');
    });

    it('should sanitize all values before setting them', () => {
      const valuesToSet = {
        custom_field1: '<script>attack1</script>',
        custom_field2: { nested: '<script>attack2</script>' },
      };
      contextHelper.setContextValues(valuesToSet);
      expect(mockStore.custom_field1).toBe('');
      expect(mockStore.custom_field2.nested).toBe('');
    });

    it('should throw an error if any key is invalid', () => {
      const valuesToSet = {
        [CONTEXT_KEYS.USER_ID]: 'user-123',
        invalidKey: 'some-value',
      };
      expect(() => contextHelper.setContextValues(valuesToSet)).toThrow(
        'Failed to set context values: Invalid context key: invalidKey'
      );
    });

    it('should throw an error if no context is active', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      const valuesToSet = { [CONTEXT_KEYS.USER_ID]: 'user-123' };
      expect(() => contextHelper.setContextValues(valuesToSet)).toThrow(
        'Failed to set context values: No active context found'
      );
    });
  });

  // Test suite for all specific setter functions
  describe('Specific Setters', () => {
    const testCases = [
      { func: contextHelper.setCurrentUserId, key: CONTEXT_KEYS.USER_ID, value: 'user-456' },
      { func: contextHelper.setCurrentUserData, key: CONTEXT_KEYS.USER_DATA, value: { name: 'Jane Doe' } },
      { func: contextHelper.setCurrentSessionId, key: CONTEXT_KEYS.SESSION_ID, value: 'session-def' },
      { func: contextHelper.setCurrentIpAddress, key: CONTEXT_KEYS.IP_ADDRESS, value: '192.168.1.1' },
      { func: contextHelper.setCurrentUserAgent, key: CONTEXT_KEYS.USER_AGENT, value: 'My Test Browser' },
      { func: contextHelper.setCurrentPermissions, key: CONTEXT_KEYS.PERMISSIONS, value: ['delete'] },
      { func: contextHelper.setCurrentRoles, key: CONTEXT_KEYS.ROLES, value: ['guest'] },
      { func: contextHelper.setCurrentTenantId, key: CONTEXT_KEYS.TENANT_ID, value: 'tenant-789' },
    ];

    testCases.forEach(({ func, key, value }) => {
      describe(func.name, () => {
        it(`should set the ${key} correctly`, () => {
          const result = func(value);
          expect(result).toBe(true);
          expect(mockStore[key]).toEqual(value);
        });

        it('should handle non-array inputs for array-based setters', () => {
          if (Array.isArray(value)) {
            const result = func('not-an-array');
            expect(result).toBe(true);
            expect(mockStore[key]).toEqual([]);
          }
        });
      });
    });
  });
});
