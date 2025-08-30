// =============================================================================
// FORMATTING AND CONVERTION - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Formatting and Conversion Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('convertToNumber', () => {
    test('should convert valid string numbers to numbers', () => {
      expect(numbersHelper.convertToNumber('42')).toBe(42);
      expect(numbersHelper.convertToNumber('3.14')).toBe(3.14);
      expect(numbersHelper.convertToNumber('-10')).toBe(-10);
    });

    test('should return number for number inputs', () => {
      expect(numbersHelper.convertToNumber(42)).toBe(42);
      expect(numbersHelper.convertToNumber(0)).toBe(0);
      expect(numbersHelper.convertToNumber(-5)).toBe(-5);
    });

    test('should handle edge cases', () => {
      expect(numbersHelper.convertToNumber('')).toBe(0);
      expect(numbersHelper.convertToNumber('abc')).toBeNaN();
      expect(numbersHelper.convertToNumber(null)).toBe(0);
      expect(numbersHelper.convertToNumber(undefined)).toBeNaN();
    });
  });

  describe('formatNumberToCurrency', () => {
    test('should format numbers as currency with default settings', () => {
      expect(numbersHelper.formatNumberToCurrency(1234.56)).toBe('$1,234.56');
    });

    test('should format with specified currency and locale', () => {
      // Note: These tests might vary based on the environment's Intl implementation
      const result = numbersHelper.formatNumberToCurrency(1234.56, 'EUR', 'de-DE');
      expect(typeof result).toBe('string');
      expect(result).toContain('234');
    });

    test('should handle string numbers', () => {
      expect(numbersHelper.formatNumberToCurrency('1234.56')).toBe('$1,234.56');
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.formatNumberToCurrency('abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format currency', 'Invalid number provided');
    });

    test('should handle formatting errors gracefully', () => {
      // Mock Intl.NumberFormat to throw an error
      const originalNumberFormat = Intl.NumberFormat;
      Intl.NumberFormat = jest.fn().mockImplementation(() => {
        throw new Error('Formatting error');
      });

      expect(numbersHelper.formatNumberToCurrency(1234.56)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format currency', 'Formatting error: Formatting error');

      // Restore original
      Intl.NumberFormat = originalNumberFormat;
    });
  });

  describe('formatNumberWithCommas', () => {
    test('should format numbers with thousand separators', () => {
      expect(numbersHelper.formatNumberWithCommas(1234567)).toBe('1,234,567');
      expect(numbersHelper.formatNumberWithCommas(1234567.89)).toBe('1,234,567.89');
    });

    test('should handle string numbers', () => {
      expect(numbersHelper.formatNumberWithCommas('1234567')).toBe('1,234,567');
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.formatNumberWithCommas('abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format with commas', 'Invalid number provided');
    });

    test('should return null for invalid locale', () => {
      expect(numbersHelper.formatNumberWithCommas(1, null)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format with commas', expect.stringContaining('Formatting error:'));
    });
  });

  describe('toScientificNotation', () => {
    test('should convert to scientific notation with default precision', () => {
      expect(numbersHelper.toScientificNotation(1234567)).toBe('1.23e+6');
      expect(numbersHelper.toScientificNotation(0.00012)).toBe('1.20e-4');
    });

    test('should handle custom precision', () => {
      expect(numbersHelper.toScientificNotation(0.00012, 3)).toBe('1.200e-4');
      expect(numbersHelper.toScientificNotation(1234567, 4)).toBe('1.2346e+6');
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.toScientificNotation('1234567', '2')).toBe('1.23e+6');
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.toScientificNotation('abc')).toBeNull();
      expect(numbersHelper.toScientificNotation(1234567, 'abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Scientific notation', 'Invalid parameters provided');
    });
  });

  describe('degreesToRadians', () => {
    test('should convert degrees to radians', () => {
      expect(numbersHelper.degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(numbersHelper.degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(numbersHelper.degreesToRadians(0)).toBe(0);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.degreesToRadians('180')).toBeCloseTo(Math.PI, 5);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.degreesToRadians('abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Convert to radians', 'Invalid degrees provided');
    });

    test('should handle negative degrees', () => {
      expect(numbersHelper.degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 5);
    });
  });

  describe('radiansToDegrees', () => {
    test('should convert radians to degrees', () => {
      expect(numbersHelper.radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
      expect(numbersHelper.radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(numbersHelper.radiansToDegrees(0)).toBe(0);
    });

    test('should handle string inputs', () => {
      expect(numbersHelper.radiansToDegrees(String(Math.PI))).toBeCloseTo(180, 5);
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.radiansToDegrees('abc')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Convert to degrees', 'Invalid radians provided');
    });

    test('should handle negative radians', () => {
      expect(numbersHelper.radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90, 5);
    });
  });
});
