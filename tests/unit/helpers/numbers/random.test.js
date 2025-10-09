// =============================================================================
// RANDOM - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../utils/numbers.util');

describe('Random Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRandomNumber', () => {
    test('should generate numbers within range', () => {
      // Mock Math.random to return predictable values
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      expect(numbersHelper.getRandomNumber(1, 10)).toBe(6); // 0.5 * (10-1+1) + 1 = 5.5 + 1 = 6.5 -> floor = 6
      mockRandom.mockReturnValue(0);
      expect(numbersHelper.getRandomNumber(1, 10)).toBe(1);
      mockRandom.mockReturnValue(0.99);
      expect(numbersHelper.getRandomNumber(1, 10)).toBe(10);

      mockRandom.mockRestore();
    });

    test('should handle string inputs', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(numbersHelper.getRandomNumber('1', '10')).toBe(6);
      mockRandom.mockRestore();
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.getRandomNumber('abc', 10)).toBeNull();
      expect(numbersHelper.getRandomNumber(1, 'abc')).toBeNull();
      expect(numbersHelper.getRandomNumber('abc', 'abc')).toBeNull();
      expect(numbersHelper.getRandomNumber()).toBeNull();
    });

    test('should return null when min > max', () => {
      expect(numbersHelper.getRandomNumber(10, 1)).toBeNull();
    });

    test('should handle equal min and max', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(numbersHelper.getRandomNumber(5, 5)).toBe(5);
      mockRandom.mockRestore();
    });
  });

  describe('getRandomFloat', () => {
    test('should generate floats within range with specified decimals', () => {
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.5);

      expect(numbersHelper.getRandomFloat(1.0, 2.0, 2)).toBe(1.5);
      expect(numbersHelper.getRandomFloat(0, 1)).toBe(0.5); // default 2 decimals

      mockRandom.mockRestore();
    });

    test('should handle string inputs', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(numbersHelper.getRandomFloat('1.0', '2.0', '2')).toBe(1.5);
      mockRandom.mockRestore();
    });

    test('should return null for invalid inputs', () => {
      expect(numbersHelper.getRandomFloat('abc', 2.0, 2)).toBeNull();
      expect(numbersHelper.getRandomFloat(1.0, 'abc', 2)).toBeNull();
      expect(numbersHelper.getRandomFloat(1.0, 2.0, 'abc')).toBeNull();
    });

    test('should return null when min > max', () => {
      expect(numbersHelper.getRandomFloat(2.0, 1.0, 2)).toBeNull();
    });
  });
});
