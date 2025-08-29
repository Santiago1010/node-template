// =============================================================================
// PERCENTAGE - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Percentage Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePercentage', () => {
    test('should calculate percentage correctly', () => {
      expect(numbersHelper.calculatePercentage(25, 100)).toBe(25.0);
      expect(numbersHelper.calculatePercentage(15, 75)).toBe(20.0);
      expect(numbersHelper.calculatePercentage(1, 3)).toBe(33.33);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.calculatePercentage('25', '100')).toBe(25.0);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.calculatePercentage('abc', 100)).toBeNull();
      expect(numbersHelper.calculatePercentage(25, 'abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate percentage', 'Invalid parameters provided');
    });

    test('should return null for division by zero', () => {
      expect(numbersHelper.calculatePercentage(25, 0)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate percentage', 'Division by zero: total cannot be 0');
    });

    test('should handle negative numbers', () => {
      expect(numbersHelper.calculatePercentage(-25, 100)).toBe(-25.0);
      expect(numbersHelper.calculatePercentage(25, -100)).toBe(-25.0);
    });
  });

  describe('calculatePercentageValue', () => {
    test('should calculate percentage value correctly', () => {
      expect(numbersHelper.calculatePercentageValue(25, 100)).toBe(25);
      expect(numbersHelper.calculatePercentageValue(15, 200)).toBe(30);
      expect(numbersHelper.calculatePercentageValue(50, 80)).toBe(40);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.calculatePercentageValue('25', '100')).toBe(25);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.calculatePercentageValue('abc', 100)).toBeNull();
      expect(numbersHelper.calculatePercentageValue(25, 'abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate percentage value', 'Invalid parameters provided');
    });

    test('should handle zero values', () => {
      expect(numbersHelper.calculatePercentageValue(0, 100)).toBe(0);
      expect(numbersHelper.calculatePercentageValue(25, 0)).toBe(0);
    });
  });

  describe('calculatePercentageChange', () => {
    test('should calculate percentage change correctly', () => {
      expect(numbersHelper.calculatePercentageChange(100, 150)).toBe(50.0);
      expect(numbersHelper.calculatePercentageChange(200, 150)).toBe(-25.0);
      expect(numbersHelper.calculatePercentageChange(100, 100)).toBe(0.0);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.calculatePercentageChange('100', '150')).toBe(50.0);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.calculatePercentageChange('abc', 150)).toBeNull();
      expect(numbersHelper.calculatePercentageChange(100, 'abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate percentage change', 'Invalid parameters provided');
    });

    test('should return null for division by zero', () => {
      expect(numbersHelper.calculatePercentageChange(0, 150)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate percentage change', 'Original value cannot be 0');
    });
  });
});
