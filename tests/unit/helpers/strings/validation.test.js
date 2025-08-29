// =============================================================================
// STRING VALIDATION - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../helpers/strings.helper');

describe('String Validation Functions', () => {
  describe('isValidString', () => {
    test('should return true for valid strings', () => {
      expect(stringsHelper.isValidString('hello')).toBe(true);
      expect(stringsHelper.isValidString('  hello world  ')).toBe(true);
    });

    test('should return false for invalid strings', () => {
      expect(stringsHelper.isValidString('')).toBe(false);
      expect(stringsHelper.isValidString('   ')).toBe(false);
      expect(stringsHelper.isValidString(null)).toBe(false);
      expect(stringsHelper.isValidString(undefined)).toBe(false);
      expect(stringsHelper.isValidString(123)).toBe(false);
      expect(stringsHelper.isValidString({})).toBe(false);
      expect(stringsHelper.isValidString([])).toBe(false);
    });
  });

  describe('isAlphaOnly', () => {
    test('should return true for alpha-only strings', () => {
      expect(stringsHelper.isAlphaOnly('HelloWorld')).toBe(true);
      expect(stringsHelper.isAlphaOnly('abc')).toBe(true);
    });

    test('should return false for non-alpha-only strings', () => {
      expect(stringsHelper.isAlphaOnly('Hello World')).toBe(false);
      expect(stringsHelper.isAlphaOnly('Hello123 World')).toBe(false);
      expect(stringsHelper.isAlphaOnly('   ')).toBe(false);
      expect(stringsHelper.isAlphaOnly('')).toBe(false);
    });
  });

  describe('isNumericOnly', () => {
    test('should return true for numeric-only strings', () => {
      expect(stringsHelper.isNumericOnly('123456')).toBe(true);
    });

    test('should return false for non-numeric-only strings', () => {
      expect(stringsHelper.isNumericOnly('Hello123 World')).toBe(false);
      expect(stringsHelper.isNumericOnly('123 456')).toBe(false);
      expect(stringsHelper.isNumericOnly('   ')).toBe(false);
      expect(stringsHelper.isNumericOnly('')).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    test('should return true for alphanumeric strings', () => {
      expect(stringsHelper.isAlphanumeric('HelloWorld123')).toBe(true);
    });

    test('should return false for non-alphanumeric strings', () => {
      expect(stringsHelper.isAlphanumeric('Hello World 123')).toBe(false);
      expect(stringsHelper.isAlphanumeric('   ')).toBe(false);
      expect(stringsHelper.isAlphanumeric('')).toBe(false);
    });
  });

  describe('isEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(stringsHelper.isEmail('user@example.com')).toBe(true);
      expect(stringsHelper.isEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(stringsHelper.isEmail('user@example')).toBe(false);
      expect(stringsHelper.isEmail('user@.com')).toBe(false);
      expect(stringsHelper.isEmail('user')).toBe(false);
      expect(stringsHelper.isEmail('')).toBe(false);
    });

    test('should handle custom domains and TLDs', () => {
      expect(stringsHelper.isEmail('user@custom', { customDomain: 'custom' })).toBe(true);
      expect(stringsHelper.isEmail('user@custom.net', { customDomain: 'custom', customTLD: 'net' })).toBe(true);
      expect(stringsHelper.isEmail('user@example.com', { customTLD: 'com' })).toBe(true);
    });
  });

  describe('isURL', () => {
    test('should return true for valid URLs', () => {
      expect(stringsHelper.isURL('https://example.com')).toBe(true);
      expect(stringsHelper.isURL('http://example.com')).toBe(true);
      expect(stringsHelper.isURL('www.example.com')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(stringsHelper.isURL('example')).toBe(false);
      expect(stringsHelper.isURL('ftp://example.com')).toBe(false);
    });
  });

  describe('isPhoneNumber', () => {
    test('should return true for valid phone numbers', () => {
      expect(stringsHelper.isPhoneNumber('+1 (123) 456-7890')).toBe(true);
      expect(stringsHelper.isPhoneNumber('1234567890')).toBe(true);
    });

    test('should return false for invalid phone numbers', () => {
      expect(stringsHelper.isPhoneNumber('12345')).toBe(false);
      expect(stringsHelper.isPhoneNumber('abcdefghij')).toBe(false);
    });
  });

  describe('isPalindrome', () => {
    test('should return true for palindromes', () => {
      expect(stringsHelper.isPalindrome('madam')).toBe(true);
      expect(stringsHelper.isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
    });

    test('should return false for non-palindromes', () => {
      expect(stringsHelper.isPalindrome('hello')).toBe(false);
    });

    test('should handle case sensitivity and spaces', () => {
      expect(stringsHelper.isPalindrome('Madam')).toBe(true);
      expect(stringsHelper.isPalindrome('nurses run')).toBe(true);
      expect(stringsHelper.isPalindrome('nurses run', false)).toBe(false);
    });
  });
});
