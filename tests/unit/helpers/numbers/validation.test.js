// =============================================================================
// VALIDATION - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');

describe('Validation Functions', () => {
  describe('isValidNumber', () => {
    test('should return true for valid numbers', () => {
      expect(numbersHelper.isValidNumber(42)).toBe(true);
      expect(numbersHelper.isValidNumber('42')).toBe(true);
      expect(numbersHelper.isValidNumber(3.14)).toBe(true);
      expect(numbersHelper.isValidNumber('-10')).toBe(true);
      expect(numbersHelper.isValidNumber(0)).toBe(true);
    });

    test('should return false for invalid numbers', () => {
      expect(numbersHelper.isValidNumber('abc')).toBe(false);
      expect(numbersHelper.isValidNumber(NaN)).toBe(false);
      expect(numbersHelper.isValidNumber(Infinity)).toBe(false);
      expect(numbersHelper.isValidNumber(-Infinity)).toBe(false);
      expect(numbersHelper.isValidNumber(null)).toBe(false);
      expect(numbersHelper.isValidNumber(undefined)).toBe(false);
      expect(numbersHelper.isValidNumber({})).toBe(false);
      expect(numbersHelper.isValidNumber([])).toBe(false);
    });

    test('should return false for non-numbers', () => {
      expect(numbersHelper.isValidNumber('string')).toBe(false);
    });
  });

  describe('isInRange', () => {
    test('should return true for numbers in range', () => {
      expect(numbersHelper.isInRange(5, 1, 10)).toBe(true);
      expect(numbersHelper.isInRange(1, 1, 10)).toBe(true);
      expect(numbersHelper.isInRange(10, 1, 10)).toBe(true);
      expect(numbersHelper.isInRange('5', 1, 10)).toBe(true);
    });

    test('should return false for numbers out of range', () => {
      expect(numbersHelper.isInRange(15, 1, 10)).toBe(false);
      expect(numbersHelper.isInRange(0, 1, 10)).toBe(false);
      expect(numbersHelper.isInRange(-5, 1, 10)).toBe(false);
    });

    test('should return false for invalid inputs', () => {
      expect(numbersHelper.isInRange('abc', 1, 10)).toBe(false);
      expect(numbersHelper.isInRange(5, 'abc', 10)).toBe(false);
      expect(numbersHelper.isInRange(5, 1, 'abc')).toBe(false);
      expect(numbersHelper.isInRange(null, 1, 10)).toBe(false);
    });

    test('should return false for non-numbers', () => {
      expect(numbersHelper.isInRange('string', null, 'false')).toBe(false);
      expect(numbersHelper.isInRange('string', null, null)).toBe(false);
      expect(numbersHelper.isInRange(null, null, null)).toBe(false);
      expect(numbersHelper.isInRange(1, null, null)).toBe(false);
      expect(numbersHelper.isInRange(1, null, 'false')).toBe(false);
      expect(numbersHelper.isInRange('false', null, null)).toBe(false);
      expect(numbersHelper.isInRange(null, 1, null)).toBe(false);
      expect(numbersHelper.isInRange(null, 1, 'false')).toBe(false);
      expect(numbersHelper.isInRange('false', 1, null)).toBe(false);
    });

    test('should return false when first parameter is invalid', () => {
      expect(numbersHelper.isInRange(undefined, 1, 10)).toBe(false);
      expect(numbersHelper.isInRange(NaN, 1, 10)).toBe(false);
    });
  });

  describe('isInteger', () => {
    test('should return true for integers', () => {
      expect(numbersHelper.isInteger(42)).toBe(true);
      expect(numbersHelper.isInteger('42')).toBe(true);
      expect(numbersHelper.isInteger(0)).toBe(true);
      expect(numbersHelper.isInteger(-5)).toBe(true);
    });

    test('should return false for non-integers', () => {
      expect(numbersHelper.isInteger(42.5)).toBe(false);
      expect(numbersHelper.isInteger('42.5')).toBe(false);
      expect(numbersHelper.isInteger('abc')).toBe(false);
      expect(numbersHelper.isInteger(NaN)).toBe(false);
    });
  });

  describe('isPositive', () => {
    test('should return true for positive numbers', () => {
      expect(numbersHelper.isPositive(42)).toBe(true);
      expect(numbersHelper.isPositive('42')).toBe(true);
      expect(numbersHelper.isPositive(0.1)).toBe(true);
    });

    test('should return false for non-positive numbers', () => {
      expect(numbersHelper.isPositive(0)).toBe(false);
      expect(numbersHelper.isPositive(-42)).toBe(false);
      expect(numbersHelper.isPositive('abc')).toBe(false);
    });
  });

  describe('isEven', () => {
    test('should return true for even numbers', () => {
      expect(numbersHelper.isEven(4)).toBe(true);
      expect(numbersHelper.isEven('4')).toBe(true);
      expect(numbersHelper.isEven(0)).toBe(true);
      expect(numbersHelper.isEven(-2)).toBe(true);
    });

    test('should return false for odd numbers', () => {
      expect(numbersHelper.isEven(5)).toBe(false);
      expect(numbersHelper.isEven('5')).toBe(false);
      expect(numbersHelper.isEven(-3)).toBe(false);
    });

    test('should return false for non-integers', () => {
      expect(numbersHelper.isEven(4.5)).toBe(false);
      expect(numbersHelper.isEven('abc')).toBe(false);
    });
  });

  describe('isOdd', () => {
    test('should return true for odd numbers', () => {
      expect(numbersHelper.isOdd(5)).toBe(true);
      expect(numbersHelper.isOdd('5')).toBe(true);
      expect(numbersHelper.isOdd(-3)).toBe(true);
    });

    test('should return false for even numbers', () => {
      expect(numbersHelper.isOdd(4)).toBe(false);
      expect(numbersHelper.isOdd('4')).toBe(false);
      expect(numbersHelper.isOdd(0)).toBe(false);
    });

    test('should return false for non-integers', () => {
      expect(numbersHelper.isOdd(5.5)).toBe(false);
      expect(numbersHelper.isOdd('abc')).toBe(false);
    });
  });
});
