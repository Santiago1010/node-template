// =============================================================================
// SANITIZATION - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Sanitization Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clampNumber', () => {
    test('should clamp numbers within range', () => {
      expect(numbersHelper.clampNumber(15, 0, 10)).toBe(10);
      expect(numbersHelper.clampNumber(-5, 0, 10)).toBe(0);
      expect(numbersHelper.clampNumber(5, 0, 10)).toBe(5);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.clampNumber('15', '0', '10')).toBe(10);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.clampNumber('abc', 0, 10)).toBeNull();
      expect(numbersHelper.clampNumber(5, 'abc', 10)).toBeNull();
      expect(numbersHelper.clampNumber(5, 0, 'abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Clamp number', 'Invalid parameters provided');
    });

    test('should return null when min > max', () => {
      expect(numbersHelper.clampNumber(5, 10, 0)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Clamp number', 'Minimum value must be less than or equal to maximum');
    });

    test('should handle edge cases', () => {
      expect(numbersHelper.clampNumber(0, 0, 0)).toBe(0);
      expect(numbersHelper.clampNumber(-10, -5, -1)).toBe(-5);
    });
  });
});
