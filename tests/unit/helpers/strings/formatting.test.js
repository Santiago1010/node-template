// =============================================================================
// STRING FORMATTING - UNIT TESTS
// =============================================================================
const stringsHelper = require('../../../../helpers/strings.helper');
const { ESCAPE_SEQUENCES } = require('../../../../helpers/constants.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('String Formatting Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatCapitalize', () => {
    test('should capitalize the first letter of each word', () => {
      expect(stringsHelper.formatCapitalize('hello world')).toBe('Hello World');
      expect(stringsHelper.formatCapitalize('  leading and trailing spaces  ')).toBe('Leading And Trailing Spaces');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.formatCapitalize('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format Capitalize', 'Invalid string provided');
    });
  });

  describe('formatNames', () => {
    test('should clean and capitalize a name', () => {
      expect(stringsHelper.formatNames('  john  doe  ')).toBe('John Doe');
      expect(stringsHelper.formatNames('john   doe')).toBe('John Doe');
      expect(stringsHelper.formatNames('null john undefined doe')).toBe('John Doe');
    });

    test('should return null for invalid or empty input', () => {
      expect(stringsHelper.formatNames(null)).toBeNull();
      expect(stringsHelper.formatNames('')).toBeNull();
      expect(stringsHelper.formatNames('null undefined')).toBeNull();
    });
  });

  describe('toTitleCase', () => {
    test('should convert a string to title case', () => {
      expect(stringsHelper.toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    test('should not capitalize exceptions', () => {
      expect(stringsHelper.toTitleCase('a tale of two cities', ['a', 'of'])).toBe('A Tale of Two Cities');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toTitleCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Title Case', 'Invalid string provided');
    });
  });

  describe('formatEscapeSequences', () => {
    test('should replace escape sequences with literal characters', () => {
      expect(stringsHelper.formatEscapeSequences('hello\nworld')).toBe('hello\nworld');
      expect(stringsHelper.formatEscapeSequences('hello\tworld')).toBe('hello\tworld');
      expect(stringsHelper.formatEscapeSequences('\\n')).toBe('\n');
      expect(stringsHelper.formatEscapeSequences('\\t')).toBe('\t');
      expect(stringsHelper.formatEscapeSequences("\\'")).toBe("'");
      expect(stringsHelper.formatEscapeSequences('\\"')).toBe('"');
      expect(stringsHelper.formatEscapeSequences('\\/')).toBe('/');
      expect(stringsHelper.formatEscapeSequences('\\b')).toBe('\b');
      expect(stringsHelper.formatEscapeSequences('\\f')).toBe('\f');
      expect(stringsHelper.formatEscapeSequences('\\r')).toBe('\r');
      expect(stringsHelper.formatEscapeSequences('\\\\')).toBe('\\');
    });

    test('should return null for null input', () => {
      expect(stringsHelper.formatEscapeSequences(null)).toBeNull();
    });

    test('should throw an error for non-string input', () => {
      expect(() => stringsHelper.formatEscapeSequences(123)).toThrow('inputText must be a string');
    });

    test('should leave unknown escape sequences unchanged', () => {
      expect(stringsHelper.formatEscapeSequences('\\x')).toBe('\\x');
      expect(stringsHelper.formatEscapeSequences('hello\\nworld\\x')).toBe('hello\nworld\\x');
    });

    test('should handle edge case where character is not in ESCAPE_SEQUENCES', () => {
      const originalValue = ESCAPE_SEQUENCES['n'];
      delete ESCAPE_SEQUENCES['n'];

      expect(stringsHelper.formatEscapeSequences('\\n')).toBe('\\n');

      ESCAPE_SEQUENCES['n'] = originalValue;
    });
  });

  describe('wrapText', () => {
    test('should wrap text to a specified width', () => {
      const text = 'This is a long string that needs to be wrapped.';
      const wrapped = 'This is a long\nstring that\nneeds to be\nwrapped.';
      expect(stringsHelper.wrapText(text, 15)).toBe(wrapped);
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.wrapText('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Wrap Text', 'Invalid text provided');
    });
  });
});
