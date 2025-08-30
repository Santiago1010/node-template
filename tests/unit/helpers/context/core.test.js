// =============================================================================
// CORE CONTEXT - UNIT TESTS
// =============================================================================

const contextHelper = require('../../../../helpers/context.helper');
const asyncLocalStorage = require('../../../../config/context');
const debugHelper = require('../../../../helpers/debug.helper');

// Mock the asyncLocalStorage
jest.mock('../../../../config/context', () => ({
  run: jest.fn((_, callback) => callback()),
  getStore: jest.fn(),
}));

// Mock dependencies
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));
jest.mock('../../../../helpers/constants.helper', () => ({
  CONTEXT_KEYS: {
    TIMESTAMP: 'timestamp',
    REQUEST_ID: 'requestId',
    CUSTOM_DATA: 'customData',
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Core Context Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('runWithContext', () => {
    it('should initialize a new context with default values and run the callback', async () => {
      const callback = jest.fn();
      await contextHelper.runWithContext({}, callback);

      // Expect asyncLocalStorage.run to be called
      expect(asyncLocalStorage.run).toHaveBeenCalledTimes(1);

      // Check the context data passed to asyncLocalStorage.run
      const contextData = asyncLocalStorage.run.mock.calls[0][0];
      expect(contextData).toHaveProperty('timestamp');
      expect(contextData).toHaveProperty('requestId');
      expect(contextData).toHaveProperty('customData');
      expect(contextData.customData).toEqual({});
      expect(contextData).toHaveProperty('permissions');
      expect(contextData.permissions).toEqual([]);
      expect(contextData).toHaveProperty('roles');
      expect(contextData.roles).toEqual([]);

      // Expect the callback to have been called
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should initialize context with provided initial data', async () => {
      const initialData = { userId: 'test-user', data: { value: 123 } };
      const callback = jest.fn();
      await contextHelper.runWithContext(initialData, callback);

      expect(asyncLocalStorage.run).toHaveBeenCalledTimes(1);
      const contextData = asyncLocalStorage.run.mock.calls[0][0];

      // Check if initialData is merged correctly
      expect(contextData).toHaveProperty('userId', 'test-user');
      expect(contextData).toHaveProperty('data', { value: 123 });
    });

    it('should sanitize initial data before creating context', async () => {
      const maliciousData = {
        userInput: '<script>alert("xss")</script>',
      };
      const callback = jest.fn();
      await contextHelper.runWithContext(maliciousData, callback);

      expect(asyncLocalStorage.run).toHaveBeenCalledTimes(1);
      const contextData = asyncLocalStorage.run.mock.calls[0][0];

      // Check if the malicious script is sanitized
      expect(contextData.userInput).toBe('');
    });

    it('should return the result of the callback function', async () => {
      const callback = jest.fn(() => 'callback result');
      const result = await contextHelper.runWithContext({}, callback);

      expect(result).toBe('callback result');
    });

    it('should throw an error if the callback throws an error', async () => {
      const error = new Error('Callback failed');
      const callback = jest.fn(() => {
        throw error;
      });

      // The helper should re-throw the error, wrapped in its own message
      await expect(contextHelper.runWithContext({}, callback)).rejects.toThrow(
        'Failed to run with context: Callback failed'
      );
    });
  });

  describe('getContext', () => {
    it('should return the current context from the store', () => {
      const mockStore = { userId: 'test-user' };
      asyncLocalStorage.getStore.mockReturnValue(mockStore);

      const context = contextHelper.getContext();
      expect(context).toBe(mockStore);
      expect(asyncLocalStorage.getStore).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if no context is available', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);

      const context = contextHelper.getContext();
      expect(context).toBeUndefined();
    });

    it('should throw an error if getStore fails', () => {
      const error = new Error('Store error');
      asyncLocalStorage.getStore.mockImplementation(() => {
        throw error;
      });

      expect(() => contextHelper.getContext()).toThrow('Failed to get context: Store error');
    });
  });

  describe('hasContext', () => {
    it('should return true if context exists', () => {
      asyncLocalStorage.getStore.mockReturnValue({});
      expect(contextHelper.hasContext()).toBe(true);
    });

    it('should return false if context does not exist', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      expect(contextHelper.hasContext()).toBe(false);
    });

    it('should return false and log an error if getStore fails', () => {
      const error = new Error('Store error');
      asyncLocalStorage.getStore.mockImplementation(() => {
        throw error;
      });

      expect(contextHelper.hasContext()).toBe(false);
      expect(debugHelper.cerror).toHaveBeenCalledWith('Has context', 'Error checking context: Store error');
    });
  });

  describe('clearContext', () => {
    // Note: AsyncLocalStorage doesn't have a direct clear method.
    // This test just ensures the function runs without error as per its implementation.
    it('should always return true', () => {
      expect(contextHelper.clearContext()).toBe(true);
    });
  });
});
