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
});
