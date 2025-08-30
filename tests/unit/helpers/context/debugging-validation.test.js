// =============================================================================
// DEBUGGING AND VALIDATION - UNIT TESTS
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
    SESSION_ID: 'sessionId',
    REQUEST_ID: 'requestId',
    TIMESTAMP: 'timestamp',
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
    TENANT_ID: 'tenantId',
    CUSTOM_DATA: 'customData',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Debugging and Validation', () => {
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {
      [CONTEXT_KEYS.USER_ID]: 'user-123',
      [CONTEXT_KEYS.SESSION_ID]: 'session-abc',
      [CONTEXT_KEYS.REQUEST_ID]: 'req-xyz',
      [CONTEXT_KEYS.TIMESTAMP]: '2025-08-30T12:00:00.000Z',
      [CONTEXT_KEYS.PERMISSIONS]: ['read', 'write'],
      [CONTEXT_KEYS.ROLES]: ['admin'],
      [CONTEXT_KEYS.TENANT_ID]: 'tenant-456',
      [CONTEXT_KEYS.CUSTOM_DATA]: { key: 'value' },
    };
    asyncLocalStorage.getStore.mockReturnValue(mockStore);
  });

  describe('getContextSummary', () => {
    it('should return a summary of the current context', () => {
      const summary = contextHelper.getContextSummary();
      expect(summary).toEqual({
        userId: 'user-123',
        sessionId: 'session-abc',
        requestId: 'req-xyz',
        timestamp: '2025-08-30T12:00:00.000Z',
        permissions: 2,
        roles: 1,
        tenantId: 'tenant-456',
      });
    });

    it('should include custom data when requested', () => {
      const summary = contextHelper.getContextSummary(true);
      expect(summary.customData).toEqual({ key: 'value' });
    });

    it('should indicate when values are not set', () => {
      asyncLocalStorage.getStore.mockReturnValue({});
      const summary = contextHelper.getContextSummary();
      expect(summary).toEqual({
        userId: 'Not set',
        sessionId: 'Not set',
        requestId: 'Not set',
        timestamp: 'Not set',
        permissions: 0,
        roles: 0,
        tenantId: 'Not set',
      });
    });

    it('should return an error object if no context is active', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      const summary = contextHelper.getContextSummary();
      expect(summary).toEqual({ error: 'No active context' });
    });
  });

  describe('validateContext', () => {
    it('should return valid for a well-formed context', () => {
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return invalid if context is missing', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toEqual(['No active context found']);
    });

    it('should detect a missing timestamp', () => {
      delete mockStore[CONTEXT_KEYS.TIMESTAMP];
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing timestamp');
    });

    it('should detect a missing request ID', () => {
      delete mockStore[CONTEXT_KEYS.REQUEST_ID];
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing request ID');
    });

    it('should detect if permissions is not an array', () => {
      mockStore[CONTEXT_KEYS.PERMISSIONS] = 'not-an-array';
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Permissions should be an array');
    });

    it('should detect if roles is not an array', () => {
      mockStore[CONTEXT_KEYS.ROLES] = { role: 'admin' }; // an object, not an array
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Roles should be an array');
    });

    it('should accumulate multiple issues', () => {
      delete mockStore[CONTEXT_KEYS.TIMESTAMP];
      mockStore[CONTEXT_KEYS.ROLES] = 'invalid';
      const result = contextHelper.validateContext();
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues).toContain('Missing timestamp');
      expect(result.issues).toContain('Roles should be an array');
    });
  });
});
