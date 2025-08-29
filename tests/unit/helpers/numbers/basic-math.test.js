// =============================================================================
// BASIC MATH - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Basic Math Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sumNumbers', () => {
    test('should sum valid numbers', () => {
      expect(numbersHelper.sumNumbers(1, 2, 3, 4)).toBe(10);
      expect(numbersHelper.sumNumbers(1, '2', 3)).toBe(6);
      expect(numbersHelper.sumNumbers(0)).toBe(0);
    });

    test('should ignore invalid values', () => {
      expect(numbersHelper.sumNumbers(1, 'abc', 3)).toBe(4);
      expect(numbersHelper.sumNumbers(1, null, 3)).toBe(4);
      expect(numbersHelper.sumNumbers(1, undefined, 3)).toBe(4);
    });

    test('should return 0 for no valid numbers', () => {
      expect(numbersHelper.sumNumbers('abc', null, undefined)).toBe(0);
    });

    test('should handle negative numbers', () => {
      expect(numbersHelper.sumNumbers(-1, -2, -3)).toBe(-6);
      expect(numbersHelper.sumNumbers(5, -2, 3)).toBe(6);
    });
  });

  describe('average', () => {
    test('should calculate average of valid numbers', () => {
      expect(numbersHelper.average(1, 2, 3, 4, 5)).toBe(3);
      expect(numbersHelper.average(10, 20, 30)).toBe(20);
      expect(numbersHelper.average(1, '2', 3)).toBe(2);
    });

    test('should handle single number', () => {
      expect(numbersHelper.average(42)).toBe(42);
    });

    test('should return 0 and log error for no valid numbers', () => {
      expect(numbersHelper.average('abc', null, undefined)).toBe(0);
      expect(cerror).toHaveBeenCalledWith('Calculate average', 'No valid numbers provided');
    });

    test('should ignore invalid values', () => {
      expect(numbersHelper.average(2, 'abc', 4)).toBe(3);
    });
  });

  describe('maxNumber', () => {
    test('should find maximum value', () => {
      expect(numbersHelper.maxNumber(1, 5, 3, 9, 2)).toBe(9);
      expect(numbersHelper.maxNumber(-1, -5, -3)).toBe(-1);
      expect(numbersHelper.maxNumber(1, '5', 3)).toBe(5);
    });

    test('should return null and log error for no valid numbers', () => {
      expect(numbersHelper.maxNumber('abc', null, undefined)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Find maximum', 'No valid numbers provided');
    });

    test('should ignore invalid values', () => {
      expect(numbersHelper.maxNumber(1, 'abc', 5, null, 3)).toBe(5);
    });

    test('should handle single number', () => {
      expect(numbersHelper.maxNumber(42)).toBe(42);
    });
  });

  describe('minNumber', () => {
    test('should find minimum value', () => {
      expect(numbersHelper.minNumber(1, 5, 3, 9, 2)).toBe(1);
      expect(numbersHelper.minNumber(-1, -5, -3)).toBe(-5);
      expect(numbersHelper.minNumber('1', 5, 3)).toBe(1);
    });

    test('should return null and log error for no valid numbers', () => {
      expect(numbersHelper.minNumber('abc', null, undefined)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Find minimum', 'No valid numbers provided');
    });

    test('should ignore invalid values', () => {
      expect(numbersHelper.minNumber(5, 'abc', 1, null, 3)).toBe(1);
    });

    test('should handle single number', () => {
      expect(numbersHelper.minNumber(42)).toBe(42);
    });
  });

  describe('median', () => {
    test('should calculate median of odd number of values', () => {
      expect(numbersHelper.median(1, 2, 3, 4, 5)).toBe(3);
      expect(numbersHelper.median(7, 1, 9, 3, 5)).toBe(5);
      expect(numbersHelper.median(100)).toBe(100);
    });

    test('should calculate median of even number of values', () => {
      expect(numbersHelper.median(1, 2, 3, 4)).toBe(2.5);
      expect(numbersHelper.median(10, 20)).toBe(15);
      expect(numbersHelper.median(1, 3, 5, 7)).toBe(4);
    });

    test('should handle string numbers', () => {
      expect(numbersHelper.median('1', 2, '3')).toBe(2);
      expect(numbersHelper.median('2', '4', '6', '8')).toBe(5);
    });

    test('should ignore invalid values and calculate median of valid ones', () => {
      expect(numbersHelper.median(1, 'abc', 3, null, 5)).toBe(3);
      expect(numbersHelper.median(2, undefined, 4, 'invalid', 6)).toBe(4);
      expect(numbersHelper.median(10, 'test', 20, null)).toBe(15);
    });

    test('should return null and log error for no valid numbers', () => {
      expect(numbersHelper.median('abc', null, undefined)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate median', 'No valid numbers provided');
    });

    test('should handle negative numbers', () => {
      expect(numbersHelper.median(-5, -1, -3)).toBe(-3);
      expect(numbersHelper.median(-2, 0, 2, 4)).toBe(1);
    });

    test('should handle decimal numbers', () => {
      expect(numbersHelper.median(1.1, 2.2, 3.3)).toBe(2.2);
      expect(numbersHelper.median(1.5, 2.5, 3.5, 4.5)).toBe(3);
    });

    test('should handle duplicate values', () => {
      expect(numbersHelper.median(5, 5, 5, 5)).toBe(5);
      expect(numbersHelper.median(1, 2, 2, 3)).toBe(2);
    });
  });

  describe('standardDeviation', () => {
    test('should calculate standard deviation for basic cases', () => {
      // Perfect squares for easy testing
      expect(numbersHelper.standardDeviation(1, 2, 3, 4, 5)).toBeCloseTo(1.414, 3);
      expect(numbersHelper.standardDeviation(0, 0, 0, 0)).toBe(0);
      expect(numbersHelper.standardDeviation(10)).toBe(0);
    });

    test('should calculate standard deviation for identical values', () => {
      expect(numbersHelper.standardDeviation(10, 10, 10, 10)).toBe(0);
      expect(numbersHelper.standardDeviation(5, 5, 5)).toBe(0);
    });

    test('should handle string numbers', () => {
      expect(numbersHelper.standardDeviation('1', 2, '3')).toBeCloseTo(0.816, 3);
      expect(numbersHelper.standardDeviation('0', '0', '0')).toBe(0);
    });

    test('should ignore invalid values and calculate standard deviation of valid ones', () => {
      expect(numbersHelper.standardDeviation(1, 'abc', 2, null, 3)).toBeCloseTo(0.816, 3);
      expect(numbersHelper.standardDeviation(10, undefined, 10, 'invalid', 10)).toBe(0);
    });

    test('should return null and log error for no valid numbers', () => {
      expect(numbersHelper.standardDeviation('abc', null, undefined)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Calculate standard deviation', 'No valid numbers provided');
    });

    test('should handle negative numbers', () => {
      expect(numbersHelper.standardDeviation(-2, -1, 0, 1, 2)).toBeCloseTo(1.414, 3);
      expect(numbersHelper.standardDeviation(-5, -5, -5)).toBe(0);
    });

    test('should handle decimal numbers', () => {
      expect(numbersHelper.standardDeviation(1.5, 2.5, 3.5)).toBeCloseTo(0.816, 3);
      expect(numbersHelper.standardDeviation(0.1, 0.2, 0.3)).toBeCloseTo(0.0816, 4);
    });

    test('should handle large numbers', () => {
      expect(numbersHelper.standardDeviation(100, 200, 300)).toBeCloseTo(81.649, 3);
      expect(numbersHelper.standardDeviation(1000, 1000)).toBe(0);
    });

    test('should handle two different numbers', () => {
      expect(numbersHelper.standardDeviation(1, 3)).toBe(1);
      expect(numbersHelper.standardDeviation(10, 20)).toBe(5);
    });
  });
});
