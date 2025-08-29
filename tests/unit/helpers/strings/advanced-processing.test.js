// =============================================================================
// ADVANCED STRING PROCESSING - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../helpers/strings.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Advanced String Processing Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('levenshteinDistance', () => {
    test('should calculate the Levenshtein distance between two strings', () => {
      expect(stringsHelper.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(stringsHelper.levenshteinDistance('book', 'back')).toBe(2);
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.levenshteinDistance('', 'a')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Levenshtein Distance', 'Invalid strings provided');
    });
  });

  describe('stringSimilarity', () => {
    test('should calculate the similarity between two strings', () => {
      expect(stringsHelper.stringSimilarity('kitten', 'sitting')).toBe(57.14);
      expect(stringsHelper.stringSimilarity('hello', 'hello')).toBe(100);
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.stringSimilarity('a', '')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('String Similarity', 'Invalid strings provided');
    });
  });

  describe('longestCommonSubsequence', () => {
    test('should find the longest common subsequence between two strings', () => {
      expect(stringsHelper.longestCommonSubsequence('AGGTAB', 'GXTXAYB')).toBe('GTAB');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.longestCommonSubsequence('', 'a')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Longest Common Subsequence', 'Invalid strings provided');
    });
  });

  describe('removeDiacritics', () => {
    test('should remove diacritics from a string', () => {
      expect(stringsHelper.removeDiacritics('héllo wórld')).toBe('hello world');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.removeDiacritics('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Remove Diacritics', 'Invalid string provided');
    });
  });

  describe('generateSlug', () => {
    test('should generate a slug from a string', () => {
      expect(stringsHelper.generateSlug('hello world')).toBe('hello-world');
      expect(stringsHelper.generateSlug('Héllo Wórld', { separator: '_' })).toBe('hello_world');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.generateSlug('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Generate Slug', 'Invalid string provided');
    });

    test('should handle maxLength correctly', () => {
      expect(stringsHelper.generateSlug('hello world', { maxLength: 5 })).toBe('hello');

      expect(stringsHelper.generateSlug('a b c', { maxLength: 3 })).toBe('a-b');

      expect(stringsHelper.generateSlug('short', { maxLength: 10 })).toBe('short');

      expect(
        stringsHelper.generateSlug('x y z', {
          separator: '_',
          maxLength: 3,
        })
      ).toBe('x_y');
    });

    test('should handle edge cases with maxLength', () => {
      expect(stringsHelper.generateSlug('a---b---c', { maxLength: 3 })).toBe('a-b');

      expect(stringsHelper.generateSlug('hello-world', { maxLength: 5 })).toBe('hello');
    });
  });

  describe('maskString', () => {
    test('should mask a string', () => {
      expect(stringsHelper.maskString('1234567890')).toBe('12******90');
      expect(stringsHelper.maskString('1234567890', { visibleStart: 3, visibleEnd: 3, maskChar: '#' })).toBe(
        '123####890'
      );
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.maskString('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Mask String', 'Invalid string provided');
    });
  });

  describe('extractBetween', () => {
    test('should extract substrings between delimiters', () => {
      expect(stringsHelper.extractBetween('<a>foo</a><b>bar</b>', '<', '>')).toEqual(['a', '/a', 'b', '/b']);
    });

    test('should include delimiters if specified', () => {
      expect(stringsHelper.extractBetween('<a>foo</a>', '<', '>', true)).toEqual(['<a>', '</a>']);
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.extractBetween('', '<', '>')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Extract Between', 'Invalid parameters provided');
    });
  });
});
