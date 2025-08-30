// =============================================================================
// ROUNDING AND PRECISION - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');

describe('Rounding and Precision Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('roundToDecimal', () => {
    test('should round to specified decimal places', () => {
      expect(numbersHelper.roundToDecimal(3.14159, 2)).toBe(3.14);
      expect(numbersHelper.roundToDecimal(3.14159, 4)).toBe(3.1416);
      expect(numbersHelper.roundToDecimal(3.14159)).toBe(3.14);
    });

    test('should handle string numbers', () => {
      expect(numbersHelper.roundToDecimal('3.14159', 2)).toBe(3.14);
      expect(numbersHelper.roundToDecimal('3.14159', '2')).toBe(3.14);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.roundToDecimal('abc', 2)).toBeNull();
      expect(numbersHelper.roundToDecimal(3.14159, 'abc')).toBeNull();
    });

    test('should handle edge cases', () => {
      expect(numbersHelper.roundToDecimal(0, 2)).toBe(0);
      expect(numbersHelper.roundToDecimal(-3.14159, 2)).toBe(-3.14);
    });

    test('should return null for invalid decimal places', () => {
      expect(numbersHelper.roundToDecimal('hi', -1)).toBeNull();
      expect(numbersHelper.roundToDecimal(3.14159, 'bye')).toBeNull();
      expect(numbersHelper.roundToDecimal('hello', 'bye')).toBeNull();
      expect(numbersHelper.roundToDecimal()).toBeNull();
    });
  });

  describe('ceilNumber', () => {
    test('should round numbers up', () => {
      expect(numbersHelper.ceilNumber(3.1)).toBe(4);
      expect(numbersHelper.ceilNumber(3.9)).toBe(4);
      expect(numbersHelper.ceilNumber(-3.1)).toBe(-3);
      expect(numbersHelper.ceilNumber('3.1')).toBe(4);
    });

    test('should handle integers', () => {
      expect(numbersHelper.ceilNumber(3)).toBe(3);
      expect(numbersHelper.ceilNumber(-3)).toBe(-3);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.ceilNumber('abc')).toBeNull();
    });
  });

  describe('floorNumber', () => {
    test('should round numbers down', () => {
      expect(numbersHelper.floorNumber(3.1)).toBe(3);
      expect(numbersHelper.floorNumber(3.9)).toBe(3);
      expect(numbersHelper.floorNumber(-3.1)).toBe(-4);
      expect(numbersHelper.floorNumber('3.9')).toBe(3);
    });

    test('should handle integers', () => {
      expect(numbersHelper.floorNumber(3)).toBe(3);
      expect(numbersHelper.floorNumber(-3)).toBe(-3);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.floorNumber('abc')).toBeNull();
    });
  });
});
