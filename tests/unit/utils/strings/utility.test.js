// =============================================================================
// STRING UTILITY - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../utils/strings.util');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('String Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('newlines', () => {
    test('should return a single newline by default', () => {
      expect(stringsHelper.newlines()).toBe('\n');
    });

    test('should return the specified number of newlines', () => {
      expect(stringsHelper.newlines(3)).toBe('\n\n\n');
    });

    test('should throw an error for invalid count', () => {
      expect(() => stringsHelper.newlines(-1)).toThrow('Invalid count: must be a non-negative integer');
      expect(() => stringsHelper.newlines(1.5)).toThrow('Invalid count: must be a non-negative integer');
      expect(() => stringsHelper.newlines('a')).toThrow('Invalid count: must be a non-negative integer');
    });
  });

  describe('tabs', () => {
    test('should return a single tab by default', () => {
      expect(stringsHelper.tabs()).toBe('\t');
    });

    test('should return the specified number of tabs', () => {
      expect(stringsHelper.tabs(3)).toBe('\t\t\t');
    });

    test('should throw an error for invalid count', () => {
      expect(() => stringsHelper.tabs(-1)).toThrow('Invalid count: must be a non-negative integer');
    });
  });

  describe('spaces', () => {
    test('should return a single space by default', () => {
      expect(stringsHelper.spaces()).toBe(' ');
    });

    test('should return the specified number of spaces', () => {
      expect(stringsHelper.spaces(3)).toBe('   ');
    });

    test('should throw an error for invalid count', () => {
      expect(() => stringsHelper.spaces(-1)).toThrow('Invalid count: must be a non-negative integer');
    });
  });

  describe('repeatString', () => {
    test('should repeat a string the specified number of times', () => {
      expect(stringsHelper.repeatString('a', 5)).toBe('aaaaa');
    });

    test('should use a separator if provided', () => {
      expect(stringsHelper.repeatString('a', 3, '-')).toBe('a-a-a');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.repeatString('', 5)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Repeat String', 'Invalid string provided');
      jest.clearAllMocks();
      expect(stringsHelper.repeatString('a', -1)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Repeat String', 'Invalid count: must be a non-negative integer');
    });
  });
});
