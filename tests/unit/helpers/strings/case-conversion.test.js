// =============================================================================
// CASE CONVERSION - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../helpers/strings.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Case Conversion Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toCamelCase', () => {
    test('should convert a string to camelCase', () => {
      expect(stringsHelper.toCamelCase('hello world')).toBe('helloWorld');
      expect(stringsHelper.toCamelCase('hello_world')).toBe('helloWorld');
      expect(stringsHelper.toCamelCase('hello-world')).toBe('helloWorld');
      expect(stringsHelper.toCamelCase('Hello World')).toBe('helloWorld');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toCamelCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Camel Case', 'Invalid string provided');
    });
  });

  describe('toPascalCase', () => {
    test('should convert a string to PascalCase', () => {
      expect(stringsHelper.toPascalCase('hello world')).toBe('HelloWorld');
      expect(stringsHelper.toPascalCase('hello_world')).toBe('HelloWorld');
      expect(stringsHelper.toPascalCase('hello-world')).toBe('HelloWorld');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toPascalCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Camel Case', 'Invalid string provided');
    });
  });

  describe('toSnakeCase', () => {
    test('should convert a string to snake_case', () => {
      expect(stringsHelper.toSnakeCase('hello world')).toBe('hello_world');
      expect(stringsHelper.toSnakeCase('helloWorld')).toBe('hello_world');
      expect(stringsHelper.toSnakeCase('hello-world')).toBe('hello_world');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toSnakeCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Snake Case', 'Invalid string provided');
    });
  });

  describe('toKebabCase', () => {
    test('should convert a string to kebab-case', () => {
      expect(stringsHelper.toKebabCase('hello world')).toBe('hello-world');
      expect(stringsHelper.toKebabCase('helloWorld')).toBe('hello-world');
      expect(stringsHelper.toKebabCase('hello_world')).toBe('hello-world');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toKebabCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Snake Case', 'Invalid string provided');
    });
  });

  describe('toScreamingSnakeCase', () => {
    test('should convert a string to SCREAMING_SNAKE_CASE', () => {
      expect(stringsHelper.toScreamingSnakeCase('hello world')).toBe('HELLO_WORLD');
      expect(stringsHelper.toScreamingSnakeCase('helloWorld')).toBe('HELLO_WORLD');
      expect(stringsHelper.toScreamingSnakeCase('hello_world')).toBe('HELLO_WORLD');
    });

    test('should return null for invalid input', () => {
      expect(stringsHelper.toScreamingSnakeCase('')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('To Snake Case', 'Invalid string provided');
    });
  });
});
