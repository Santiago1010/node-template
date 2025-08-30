// =============================================================================
// CUSTOM DATA - UNIT TESTS
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
    CUSTOM_DATA: 'customData',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Custom Data Management', () => {
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the store with a customData object
    mockStore = {
      [CONTEXT_KEYS.CUSTOM_DATA]: { existingKey: 'existingValue' },
    };
    asyncLocalStorage.getStore.mockReturnValue(mockStore);
  });

  describe('getCustomData', () => {
    it('should return the value for an existing custom key', () => {
      expect(contextHelper.getCustomData('existingKey')).toBe('existingValue');
    });

    it('should return the default value for a non-existing custom key', () => {
      expect(contextHelper.getCustomData('nonExistingKey', 'default')).toBe('default');
    });

    it('should return null for a non-existing key when no default is provided', () => {
      expect(contextHelper.getCustomData('nonExistingKey')).toBeNull();
    });

    it('should return default value if customData object does not exist in context', () => {
      mockStore[CONTEXT_KEYS.CUSTOM_DATA] = undefined;
      expect(contextHelper.getCustomData('anyKey', 'default')).toBe('default');
    });
  });

  describe('getAllCustomData', () => {
    it('should return the entire custom data object', () => {
      expect(contextHelper.getAllCustomData()).toEqual({ existingKey: 'existingValue' });
    });

    it('should return an empty object if custom data is not set', () => {
      delete mockStore[CONTEXT_KEYS.CUSTOM_DATA];
      expect(contextHelper.getAllCustomData()).toEqual({});
    });

    it('should return an empty object if context does not exist', () => {
      asyncLocalStorage.getStore.mockReturnValue(undefined);
      expect(contextHelper.getAllCustomData()).toEqual({});
    });
  });

  describe('setCustomData', () => {
    it('should add a new key-value pair to custom data', () => {
      const result = contextHelper.setCustomData('newKey', 'newValue');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA].newKey).toBe('newValue');
    });

    it('should update an existing key in custom data', () => {
      const result = contextHelper.setCustomData('existingKey', 'updatedValue');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA].existingKey).toBe('updatedValue');
    });

    it('should sanitize the value before setting it', () => {
      contextHelper.setCustomData('maliciousKey', '<script>attack</script>');
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA].maliciousKey).toBe('');
    });

    it('should create the customData object if it does not exist', () => {
      delete mockStore[CONTEXT_KEYS.CUSTOM_DATA];
      const result = contextHelper.setCustomData('firstKey', 'firstValue');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA]).toEqual({ firstKey: 'firstValue' });
    });
  });

  describe('removeCustomData', () => {
    it('should remove an existing key from custom data', () => {
      const result = contextHelper.removeCustomData('existingKey');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA].existingKey).toBeUndefined();
    });

    it('should not fail when removing a non-existing key', () => {
      const result = contextHelper.removeCustomData('nonExistingKey');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA]).toEqual({ existingKey: 'existingValue' });
    });

    it('should not fail if the customData object does not exist', () => {
      delete mockStore[CONTEXT_KEYS.CUSTOM_DATA];
      const result = contextHelper.removeCustomData('anyKey');
      expect(result).toBe(true);
      expect(mockStore[CONTEXT_KEYS.CUSTOM_DATA]).toEqual({});
    });
  });
});
