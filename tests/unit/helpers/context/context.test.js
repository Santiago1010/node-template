// =============================================================================
// CONTEXT HELPER TESTS
// =============================================================================

const ContextHelper = require('../../../../helpers/context.helper');
const { CONTEXT_KEYS } = require('../../../../utils/constants.util');

// Mock dependencies
jest.mock('moment', () =>
  jest.fn(() => ({
    toISOString: jest.fn(() => '2024-01-01T12:00:00.000Z'),
  }))
);

jest.mock('../../../../config/context', () => {
  const mockStore = new Map();
  return {
    run: jest.fn((data, callback) => {
      mockStore.set('current', data);
      const result = callback();
      return result;
    }),
    getStore: jest.fn(() => mockStore.get('current')),
    // Helper method for tests
    __setStore: (data) => mockStore.set('current', data),
    __clearStore: () => mockStore.delete('current'),
  };
});

jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

const asyncLocalStorage = require('../../../../config/context');
const { cerror } = require('../../../../helpers/debug.helper');

describe('ContextHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    asyncLocalStorage.__clearStore();
  });

  describe('run()', () => {
    it('should initialize context with initial data and timestamp', () => {
      const initialData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      const callback = jest.fn(() => 'result');

      const result = ContextHelper.run(initialData, callback);

      expect(asyncLocalStorage.run).toHaveBeenCalledWith(
        expect.objectContaining({
          [CONTEXT_KEYS.USER_ID]: 'user123',
          [CONTEXT_KEYS.TIMESTAMP]: '2024-01-01T12:00:00.000Z',
        }),
        callback
      );
      expect(result).toBe('result');
    });

    it('should initialize context with empty data when no initial data provided', () => {
      const callback = jest.fn(() => 'result');

      ContextHelper.run({}, callback);

      expect(asyncLocalStorage.run).toHaveBeenCalledWith(
        expect.objectContaining({
          [CONTEXT_KEYS.TIMESTAMP]: '2024-01-01T12:00:00.000Z',
        }),
        callback
      );
    });

    it('should handle errors during context initialization', () => {
      const error = new Error('Context error');
      asyncLocalStorage.run.mockImplementationOnce(() => {
        throw error;
      });

      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      expect(() => ContextHelper.run({}, () => {})).toThrow(error);
      expect(cerror).toHaveBeenCalledWith('Error running context:', error);
    });
  });

  describe('get()', () => {
    it('should return entire context when no key specified', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.get();

      expect(result).toEqual(contextData);
    });

    it('should return specific value when key specified', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.get(CONTEXT_KEYS.USER_ID);

      expect(result).toBe('user123');
    });

    it('should return null when key does not exist', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when no context exists', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.get();

      expect(result).toBeNull();
    });

    it('should handle errors during get operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Get error');
      });

      const result = ContextHelper.get();

      expect(result).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Error getting context:', expect.any(Error));
    });
  });

  describe('set()', () => {
    it('should set single key-value pair', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.set(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(true);
      expect(contextData[CONTEXT_KEYS.USER_ID]).toBe('user123');
    });

    it('should merge object into context', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);
      const dataToMerge = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };

      const result = ContextHelper.set(dataToMerge);

      expect(result).toBe(true);
      expect(contextData).toEqual(dataToMerge);
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.set(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should return false for invalid parameter type', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.set(123); // Invalid type

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Invalid parameter type. Expected string or object.');
    });

    it('should handle null object parameter', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.set(null);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Invalid parameter type. Expected string or object.');
    });

    it('should handle errors during set operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Set error');
      });

      const result = ContextHelper.set(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error setting context:', expect.any(Error));
    });
  });

  describe('update()', () => {
    it('should update existing key', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.update(CONTEXT_KEYS.USER_ID, 'user456');

      expect(result).toBe(true);
      expect(contextData[CONTEXT_KEYS.USER_ID]).toBe('user456');
    });

    it('should not update non-existing key', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.update(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith("Key 'userId' does not exist in context.");
    });

    it('should update existing keys from object', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.update({
        [CONTEXT_KEYS.USER_ID]: 'user789',
        nonexistent: 'value',
      });

      expect(result).toBe(true);
      expect(contextData[CONTEXT_KEYS.USER_ID]).toBe('user789');
      expect(contextData.nonexistent).toBeUndefined();
    });

    it('should return false when no keys to update in object', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.update({ nonexistent: 'value' });

      expect(result).toBe(false);
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.update(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should return false for invalid parameter type', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.update(123);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Invalid parameter type. Expected string or object.');
    });

    it('should handle errors during update operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Update error');
      });

      const result = ContextHelper.update(CONTEXT_KEYS.USER_ID, 'user123');

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error updating context:', expect.any(Error));
    });
  });

  describe('remove()', () => {
    it('should remove single key', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.remove(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(true);
      expect(contextData[CONTEXT_KEYS.USER_ID]).toBeUndefined();
    });

    it('should remove multiple keys from array', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.remove([CONTEXT_KEYS.USER_ID, CONTEXT_KEYS.SESSION_ID]);

      expect(result).toBe(true);
      expect(contextData[CONTEXT_KEYS.USER_ID]).toBeUndefined();
      expect(contextData[CONTEXT_KEYS.SESSION_ID]).toBeUndefined();
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.remove(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should return false for invalid parameter type', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.remove(123);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Invalid parameter type. Expected string or array.');
    });

    it('should handle errors during remove operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Remove error');
      });

      const result = ContextHelper.remove(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error removing from context:', expect.any(Error));
    });
  });

  describe('isActive()', () => {
    it('should return true when context is active', () => {
      asyncLocalStorage.__setStore({});

      const result = ContextHelper.isActive();

      expect(result).toBe(true);
    });

    it('should return false when context is not active', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.isActive();

      expect(result).toBe(false);
    });

    it('should handle errors during isActive check', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('IsActive error');
      });

      const result = ContextHelper.isActive();

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error checking context status:', expect.any(Error));
    });
  });

  describe('has()', () => {
    it('should return true when key exists', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.has(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.has(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(false);
    });

    it('should return false when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.has(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(false);
    });

    it('should handle errors during has check', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Has error');
      });

      const result = ContextHelper.has(CONTEXT_KEYS.USER_ID);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error checking key existence:', expect.any(Error));
    });
  });

  describe('keys()', () => {
    it('should return array of context keys', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.keys();

      expect(result).toEqual([CONTEXT_KEYS.USER_ID, CONTEXT_KEYS.SESSION_ID]);
    });

    it('should return empty array when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.keys();

      expect(result).toEqual([]);
    });

    it('should handle errors during keys operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Keys error');
      });

      const result = ContextHelper.keys();

      expect(result).toEqual([]);
      expect(cerror).toHaveBeenCalledWith('Error getting context keys:', expect.any(Error));
    });
  });

  describe('size()', () => {
    it('should return number of keys in context', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.size();

      expect(result).toBe(2);
    });

    it('should return 0 when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.size();

      expect(result).toBe(0);
    });

    it('should handle errors during size operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Size error');
      });

      const result = ContextHelper.size();

      expect(result).toBe(0);
      expect(cerror).toHaveBeenCalledWith('Error getting context size:', expect.any(Error));
    });
  });

  describe('clear()', () => {
    it('should clear all context data', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.clear();

      expect(result).toBe(true);
      expect(Object.keys(contextData)).toHaveLength(0);
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.clear();

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should handle errors during clear operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Clear error');
      });

      const result = ContextHelper.clear();

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error clearing context:', expect.any(Error));
    });
  });

  describe('snapshot()', () => {
    it('should create deep copy of context', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.USER_DATA]: { name: 'John', age: 30 },
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.snapshot();

      expect(result).toEqual(contextData);
      expect(result).not.toBe(contextData); // Different reference
      expect(result[CONTEXT_KEYS.USER_DATA]).not.toBe(contextData[CONTEXT_KEYS.USER_DATA]);
    });

    it('should return null when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.snapshot();

      expect(result).toBeNull();
    });

    it('should handle errors during snapshot operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Snapshot error');
      });

      const result = ContextHelper.snapshot();

      expect(result).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Error creating context snapshot:', expect.any(Error));
    });

    it('should handle JSON stringify errors', () => {
      const contextData = {};
      // Create circular reference
      contextData.circular = contextData;
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.snapshot();

      expect(result).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Error creating context snapshot:', expect.any(TypeError));
    });
  });

  describe('restore()', () => {
    it('should restore context from snapshot', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);
      const snapshot = { [CONTEXT_KEYS.SESSION_ID]: 'session456' };

      const result = ContextHelper.restore(snapshot);

      expect(result).toBe(true);
      expect(contextData).toEqual(snapshot);
    });

    it('should return false for invalid snapshot', () => {
      const contextData = {};
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.restore(null);

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Invalid snapshot provided.');
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.restore({});

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should handle errors during restore operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Restore error');
      });

      const result = ContextHelper.restore({});

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error restoring context:', expect.any(Error));
    });
  });

  describe('getUserContext()', () => {
    it('should return user-specific context data', () => {
      const contextData = {
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.USER_DATA]: { name: 'John' },
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
        [CONTEXT_KEYS.PERMISSIONS]: ['read'],
        [CONTEXT_KEYS.ROLES]: ['user'],
        other: 'data',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.getUserContext();

      expect(result).toEqual({
        userId: 'user123',
        userData: { name: 'John' },
        sessionId: 'session456',
        permissions: ['read'],
        roles: ['user'],
      });
    });

    it('should return empty object when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.getUserContext();

      expect(result).toEqual({});
    });

    it('should handle errors during getUserContext operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('GetUserContext error');
      });

      const result = ContextHelper.getUserContext();

      expect(result).toEqual({});
      expect(cerror).toHaveBeenCalledWith('Error getting user context:', expect.any(Error));
    });
  });

  describe('getRequestContext()', () => {
    it('should return request-specific context data', () => {
      const contextData = {
        [CONTEXT_KEYS.REQUEST_ID]: 'req123',
        [CONTEXT_KEYS.CORRELATION_ID]: 'corr456',
        [CONTEXT_KEYS.TRANSACTION_ID]: 'trans789',
        [CONTEXT_KEYS.IP_ADDRESS]: '127.0.0.1',
        [CONTEXT_KEYS.USER_AGENT]: 'jest',
        [CONTEXT_KEYS.TIMESTAMP]: '2024-01-01T12:00:00.000Z',
        other: 'data',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.getRequestContext();

      expect(result).toEqual({
        requestId: 'req123',
        correlationId: 'corr456',
        transactionId: 'trans789',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        timestamp: '2024-01-01T12:00:00.000Z',
      });
    });

    it('should return empty object when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.getRequestContext();

      expect(result).toEqual({});
    });

    it('should handle errors during getRequestContext operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('GetRequestContext error');
      });

      const result = ContextHelper.getRequestContext();

      expect(result).toEqual({});
      expect(cerror).toHaveBeenCalledWith('Error getting request context:', expect.any(Error));
    });
  });

  describe('getOrganizationContext()', () => {
    it('should return organization-specific context data', () => {
      const contextData = {
        [CONTEXT_KEYS.TENANT_ID]: 'tenant123',
        [CONTEXT_KEYS.ORGANIZATION_ID]: 'org456',
        [CONTEXT_KEYS.DEPARTMENT_ID]: 'dept789',
        [CONTEXT_KEYS.CLIENT_ID]: 'client1',
        other: 'data',
      };
      asyncLocalStorage.__setStore(contextData);

      const result = ContextHelper.getOrganizationContext();

      expect(result).toEqual({
        tenantId: 'tenant123',
        organizationId: 'org456',
        departmentId: 'dept789',
        clientId: 'client1',
      });
    });

    it('should return empty object when no context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.getOrganizationContext();

      expect(result).toEqual({});
    });

    it('should handle errors during getOrganizationContext operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('GetOrganizationContext error');
      });

      const result = ContextHelper.getOrganizationContext();

      expect(result).toEqual({});
      expect(cerror).toHaveBeenCalledWith('Error getting organization context:', expect.any(Error));
    });
  });

  describe('merge()', () => {
    it('should merge multiple context objects', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);
      const ctx1 = { [CONTEXT_KEYS.SESSION_ID]: 'session456' };
      const ctx2 = { [CONTEXT_KEYS.REQUEST_ID]: 'req789' };

      const result = ContextHelper.merge(ctx1, ctx2);

      expect(result).toBe(true);
      expect(contextData).toEqual({
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
        [CONTEXT_KEYS.REQUEST_ID]: 'req789',
      });
    });

    it('should handle null or invalid context objects', () => {
      const contextData = { [CONTEXT_KEYS.USER_ID]: 'user123' };
      asyncLocalStorage.__setStore(contextData);
      const ctx1 = { [CONTEXT_KEYS.SESSION_ID]: 'session456' };

      const result = ContextHelper.merge(ctx1, null, undefined, 123);

      expect(result).toBe(true);
      expect(contextData).toEqual({
        [CONTEXT_KEYS.USER_ID]: 'user123',
        [CONTEXT_KEYS.SESSION_ID]: 'session456',
      });
    });

    it('should return false when no active context', () => {
      asyncLocalStorage.getStore.mockReturnValueOnce(undefined);

      const result = ContextHelper.merge({});

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('No active context found. Make sure to call ContextHelper.run() first.');
    });

    it('should handle errors during merge operation', () => {
      asyncLocalStorage.getStore.mockImplementationOnce(() => {
        throw new Error('Merge error');
      });

      const result = ContextHelper.merge({});

      expect(result).toBe(false);
      expect(cerror).toHaveBeenCalledWith('Error merging contexts:', expect.any(Error));
    });
  });
});
