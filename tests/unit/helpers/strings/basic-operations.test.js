// =============================================================================
// BASIC STRING OPERATIONS - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../helpers/strings.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Basic String Operation Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('countOccurrences', () => {
    test('should count occurrences correctly (case-sensitive)', () => {
      expect(stringsHelper.countOccurrences('hello world hello', 'hello')).toBe(2);
      expect(stringsHelper.countOccurrences('Hello world hello', 'Hello')).toBe(1);
    });

    test('should count occurrences correctly (case-insensitive)', () => {
      expect(stringsHelper.countOccurrences('Hello world hello', 'hello', false)).toBe(2);
    });

    test('should return 0 for no occurrences', () => {
      expect(stringsHelper.countOccurrences('hello world', 'test')).toBe(0);
    });

    test('should throw an error for non-string inputs', () => {
      expect(() => stringsHelper.countOccurrences(123, 'a')).toThrow('Both "str" and "subStr" must be strings');
    });
  });

  describe('reverseString', () => {
    test('should reverse a valid string', () => {
      expect(stringsHelper.reverseString('hello')).toBe('olleh');
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.reverseString('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Reverse String', 'Invalid string provided');
    });
  });

  describe('removeWhitespace', () => {
    test('should remove all whitespace from a string', () => {
      expect(stringsHelper.removeWhitespace('  hello   world  ')).toBe('helloworld');
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.removeWhitespace('   ')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Remove Whitespace', 'Invalid string provided');
    });
  });

  describe('removeSpecialChars', () => {
    test('should remove special characters from a string', () => {
      expect(stringsHelper.removeSpecialChars('h@e#l$l%o^')).toBe('h e l l o');
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.removeSpecialChars('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Remove Special Characters', 'Invalid string provided');
    });
  });

  describe('truncateString', () => {
    test('should truncate a string to a specified length', () => {
      expect(stringsHelper.truncateString('hello world', 5)).toBe('he...');
    });

    test('should not truncate if string is shorter than max length', () => {
      expect(stringsHelper.truncateString('hello', 10)).toBe('hello');
    });

    test('should use custom ellipsis', () => {
      expect(stringsHelper.truncateString('hello world', 8, '--')).toBe('hello --');
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.truncateString('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Truncate String', 'Invalid string provided');
    });
  });

  describe('extractWords', () => {
    test('should extract words from a string', () => {
      expect(stringsHelper.extractWords('hello world, this is a test.')).toEqual([
        'hello',
        'world',
        'this',
        'is',
        'a',
        'test',
      ]);
    });

    test('should convert words to lowercase if specified', () => {
      expect(stringsHelper.extractWords('Hello World', true)).toEqual(['hello', 'world']);
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.extractWords('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Extract Words', 'Invalid string provided');
    });
  });

  describe('countWords', () => {
    test('should count words in a string', () => {
      expect(stringsHelper.countWords('hello world, this is a test.')).toBe(6);
    });

    test('should exclude numbers from word count if specified', () => {
      expect(stringsHelper.countWords('hello 123 world', { excludeNumbers: true })).toBe(2);
    });

    test('should return null and log error for invalid input', () => {
      expect(stringsHelper.countWords('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Count Words', 'Invalid string provided');
    });
  });
});
