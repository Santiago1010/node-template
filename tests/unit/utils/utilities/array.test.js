const {
  stringToArray,
  arrayToString,
  chunkArray,
  flattenArray,
  shuffleArray,
} = require('../../../../utils/utilities.util');

describe('Array Manipulation Functions', () => {
  describe('stringToArray', () => {
    it('should convert a string to an array with default options', () => {
      const result = stringToArray('hello world');
      expect(result).toEqual(['hello', 'world']);
    });

    it('should convert a string to an array with a custom separator', () => {
      const result = stringToArray('a,b,c', ',');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should convert string elements to numbers', () => {
      const result = stringToArray('1,2,3', ',', { numberElements: true });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle mixed number and string elements', () => {
      const result = stringToArray('1,a,3', ',', { numberElements: true });
      expect(result).toEqual([1, 'a', 3]);
    });

    it('should remove duplicate elements', () => {
      const result = stringToArray('a,a,b', ',', { uniqueElements: true });
      expect(result).toEqual(['a', 'b']);
    });

    it('should trim whitespace from elements', () => {
      const result = stringToArray(' a , b , c ', ',');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should not trim whitespace when disabled', () => {
      const result = stringToArray(' a , b , c ', ',', { trimElements: false });
      expect(result).toEqual([' a ', ' b ', ' c ']);
    });

    it('should handle an array as input', () => {
      const inputArray = ['a', 'b', 'c'];
      const result = stringToArray(inputArray);
      expect(result).toEqual(inputArray);
      expect(result).not.toBe(inputArray); // Should be a copy
    });

    it('should return null for invalid input', () => {
      const result = stringToArray(123);
      expect(result).toBeNull();
    });
  });

  describe('arrayToString', () => {
    it('should convert an array to a string with default conjunction', () => {
      const result = arrayToString(['hello', 'world']);
      expect(result).toBe('hello and world');
    });

    it('should convert an array to a string with a custom conjunction', () => {
      const result = arrayToString(['a', 'b', 'c'], 'or');
      expect(result).toBe('a, b or c');
    });

    it('should handle a single element array', () => {
      const result = arrayToString(['hello']);
      expect(result).toBe('hello');
    });

    it('should handle an empty array', () => {
      const result = arrayToString([]);
      expect(result).toBe('');
    });

    it('should return null for invalid input', () => {
      const result = arrayToString('not an array');
      expect(result).toBeNull();
    });
  });

  describe('chunkArray', () => {
    it('should chunk an array into smaller arrays', () => {
      const result = chunkArray([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle an empty array', () => {
      const result = chunkArray([], 2);
      expect(result).toEqual([]);
    });

    it('should return null for invalid input', () => {
      const result = chunkArray('not an array', 2);
      expect(result).toBeNull();
    });

    it('should return null for invalid size', () => {
      const result = chunkArray([1, 2, 3], 0);
      expect(result).toBeNull();
    });
  });

  describe('flattenArray', () => {
    it('should flatten a nested array with default depth', () => {
      const result = flattenArray([1, [2, [3, 4]]]);
      expect(result).toEqual([1, 2, [3, 4]]);
    });

    it('should flatten a nested array with specified depth', () => {
      const result = flattenArray([1, [2, [3, 4]]], 2);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle an empty array', () => {
      const result = flattenArray([]);
      expect(result).toEqual([]);
    });

    it('should return null for invalid input', () => {
      const result = flattenArray('not an array');
      expect(result).toBeNull();
    });
  });

  describe('shuffleArray', () => {
    it('should shuffle an array', () => {
      const inputArray = [1, 2, 3, 4, 5];
      const result = shuffleArray(inputArray);
      expect(result).not.toEqual(inputArray);
      expect(result.sort()).toEqual(inputArray.sort());
    });

    it('should handle an empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should return null for invalid input', () => {
      const result = shuffleArray('not an array');
      expect(result).toBeNull();
    });
  });
});
