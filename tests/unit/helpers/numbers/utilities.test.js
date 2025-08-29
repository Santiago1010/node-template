// =============================================================================
// UTILITIES - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');

describe('Module Exports and Integrations', () => {
  describe('Module Exports', () => {
    test('should export all expected functions', () => {
      const expectedFunctions = [
        'convertToNumber',
        'isValidNumber',
        'isInRange',
        'isInteger',
        'isPositive',
        'isEven',
        'isOdd',
        'sumNumbers',
        'average',
        'maxNumber',
        'minNumber',
        'roundToDecimal',
        'ceilNumber',
        'floorNumber',
        'getRandomNumber',
        'getRandomFloat',
        'calculatePercentage',
        'calculatePercentageValue',
        'calculatePercentageChange',
        'formatNumberToCurrency',
        'formatNumberWithCommas',
        'toScientificNotation',
        'clampNumber',
        'degreesToRadians',
        'radiansToDegrees',
      ];

      expectedFunctions.forEach((functionName) => {
        expect(numbersHelper).toHaveProperty(functionName);
        expect(typeof numbersHelper[functionName]).toBe('function');
      });

      // Verify we have the expected number of exports
      expect(Object.keys(numbersHelper)).toHaveLength(expectedFunctions.length);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex calculations with multiple functions', () => {
      const numbers = [10, 20, 30, 'abc', 40, null];
      const validNumbers = numbers.filter(numbersHelper.isValidNumber);
      const sum = numbersHelper.sumNumbers(...validNumbers);
      const avg = numbersHelper.average(...validNumbers);
      const max = numbersHelper.maxNumber(...validNumbers);
      const min = numbersHelper.minNumber(...validNumbers);

      expect(sum).toBe(100);
      expect(avg).toBe(25);
      expect(max).toBe(40);
      expect(min).toBe(10);
    });

    test('should handle percentage calculations with currency formatting', () => {
      const original = 1000;
      const current = 1250;
      const change = numbersHelper.calculatePercentageChange(original, current);
      const formattedOriginal = numbersHelper.formatNumberToCurrency(original);
      const formattedCurrent = numbersHelper.formatNumberToCurrency(current);

      expect(change).toBe(25.0);
      expect(formattedOriginal).toBe('$1,000.00');
      expect(formattedCurrent).toBe('$1,250.00');
    });

    test('should handle range validation with random generation', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.51);

      const min = 10;
      const max = 20;
      const randomInt = numbersHelper.getRandomNumber(min, max);
      const randomFloat = numbersHelper.getRandomFloat(min, max, 1);

      expect(numbersHelper.isInRange(randomInt, min, max)).toBe(true);
      expect(numbersHelper.isInRange(randomFloat, min, max)).toBe(true);
      expect(numbersHelper.isInteger(randomInt)).toBe(true);
      expect(numbersHelper.isInteger(randomFloat)).toBe(false);

      mockRandom.mockRestore();
    });

    test('should handle angle conversions', () => {
      const degrees = 180;
      const radians = numbersHelper.degreesToRadians(degrees);
      const backToDegrees = numbersHelper.radiansToDegrees(radians);

      expect(radians).toBeCloseTo(Math.PI, 5);
      expect(backToDegrees).toBeCloseTo(degrees, 5);
    });

    test('should handle number clamping with validation', () => {
      const testNumbers = [-10, 0, 5, 15, 25];
      const min = 0;
      const max = 10;

      testNumbers.forEach((num) => {
        const clamped = numbersHelper.clampNumber(num, min, max);
        expect(numbersHelper.isInRange(clamped, min, max)).toBe(true);

        if (num < min) {
          expect(clamped).toBe(min);
        } else if (num > max) {
          expect(clamped).toBe(max);
        } else {
          expect(clamped).toBe(num);
        }
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      expect(numbersHelper.isValidNumber(largeNumber)).toBe(true);
      expect(numbersHelper.formatNumberWithCommas(largeNumber)).toContain(',');
    });

    test('should handle very small numbers', () => {
      const smallNumber = Number.MIN_VALUE;
      expect(numbersHelper.isValidNumber(smallNumber)).toBe(true);
      expect(numbersHelper.isPositive(smallNumber)).toBe(true);
    });

    test('should handle zero in various operations', () => {
      expect(numbersHelper.isValidNumber(0)).toBe(true);
      expect(numbersHelper.isPositive(0)).toBe(false);
      expect(numbersHelper.isEven(0)).toBe(true);
      expect(numbersHelper.isOdd(0)).toBe(false);
      expect(numbersHelper.clampNumber(0, -5, 5)).toBe(0);
    });

    test('should handle empty arrays and no parameters', () => {
      expect(numbersHelper.sumNumbers()).toBe(0);
      expect(numbersHelper.average()).toBe(0);
      expect(numbersHelper.maxNumber()).toBeNull();
      expect(numbersHelper.minNumber()).toBeNull();
    });

    test('should handle boolean inputs', () => {
      expect(numbersHelper.isValidNumber(true)).toBe(true); // true converts to 1
      expect(numbersHelper.isValidNumber(false)).toBe(true); // false converts to 0
      expect(numbersHelper.convertToNumber(true)).toBe(1);
      expect(numbersHelper.convertToNumber(false)).toBe(0);
    });

    test('should handle array inputs', () => {
      expect(numbersHelper.isValidNumber([])).toBe(false); // [] converts to 0 but isNaN([]) is false, but isFinite(Number([])) is true
      expect(numbersHelper.isValidNumber([1])).toBe(true); // [1] converts to 1
      expect(numbersHelper.isValidNumber([1, 2])).toBe(false); // [1,2] converts to NaN
    });

    test('should handle object inputs', () => {
      expect(numbersHelper.isValidNumber({})).toBe(false);
      expect(numbersHelper.isValidNumber({ valueOf: () => 42 })).toBe(true);
    });
  });

  describe('Performance and Boundary Tests', () => {
    test('should handle multiple rapid calculations', () => {
      const iterations = 1000;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        results.push(numbersHelper.sumNumbers(i, i + 1, i + 2));
      }

      expect(results).toHaveLength(iterations);
      expect(results[0]).toBe(3); // 0 + 1 + 2
      expect(results[999]).toBe(3000); // 999 + 1000 + 1001
    });

    test('should handle precision limits correctly', () => {
      const precision = 15;
      // biome-ignore lint/correctness/noPrecisionLoss: Test requires exact value
      const number = 1.12345678901234567890123456789;
      const scientific = numbersHelper.toScientificNotation(number, precision);

      expect(typeof scientific).toBe('string');
      expect(scientific).toContain('e');
    });

    test('should maintain precision in percentage calculations', () => {
      const result1 = numbersHelper.calculatePercentage(1, 3);
      const result2 = numbersHelper.calculatePercentage(2, 3);

      expect(result1).toBe(33.33);
      expect(result2).toBe(66.67);
      expect(numbersHelper.roundToDecimal(result1 + result2, 0)).toBe(100);
    });
  });

  describe('Locale and Internationalization', () => {
    test('should handle different locales in currency formatting', () => {
      const testCases = [
        { amount: 1234.56, currency: 'USD', locale: 'en-US' },
        { amount: 1234.56, currency: 'EUR', locale: 'de-DE' },
        { amount: 1234.56, currency: 'JPY', locale: 'ja-JP' },
      ];

      testCases.forEach(({ amount, currency, locale }) => {
        const result = numbersHelper.formatNumberToCurrency(amount, currency, locale);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    test('should handle different locales in number formatting', () => {
      const testLocales = ['en-US', 'de-DE', 'fr-FR'];
      const number = 1234567.89;

      testLocales.forEach((locale) => {
        const result = numbersHelper.formatNumberWithCommas(number, locale);
        expect(typeof result).toBe('string');
        expect(result).toContain('567');
      });
    });
  });
});
