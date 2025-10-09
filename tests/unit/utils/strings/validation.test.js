// =============================================================================
// STRING VALIDATION - UNIT TESTS
// =============================================================================

const stringsHelper = require('../../../../utils/strings.util');

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

    test('should handle array of custom domains without TLD', () => {
      expect(stringsHelper.isEmail('user@example', { customDomain: ['example', 'test'] })).toBe(true);
      expect(stringsHelper.isEmail('user@test', { customDomain: ['example', 'test'] })).toBe(true);
      expect(stringsHelper.isEmail('user@invalid', { customDomain: ['example', 'test'] })).toBe(false);
    });

    test('should handle array of custom TLDs without custom domain', () => {
      expect(stringsHelper.isEmail('user@domain.com', { customTLD: ['com', 'net'] })).toBe(true);
      expect(stringsHelper.isEmail('user@domain.net', { customTLD: ['com', 'net'] })).toBe(true);
      expect(stringsHelper.isEmail('user@domain.org', { customTLD: ['com', 'net'] })).toBe(false);
    });

    test('should handle both custom domains and TLDs as arrays', () => {
      expect(
        stringsHelper.isEmail('user@mycompany.com', {
          customDomain: ['mycompany', 'test'],
          customTLD: ['com', 'net'],
        })
      ).toBe(true);
      expect(
        stringsHelper.isEmail('user@test.net', {
          customDomain: ['mycompany', 'test'],
          customTLD: ['com', 'net'],
        })
      ).toBe(true);
      expect(
        stringsHelper.isEmail('user@invalid.com', {
          customDomain: ['mycompany', 'test'],
          customTLD: ['com', 'net'],
        })
      ).toBe(false);
    });

    test('should handle mixed string/array options', () => {
      expect(
        stringsHelper.isEmail('user@mycompany.com', {
          customDomain: 'mycompany',
          customTLD: ['com', 'net'],
        })
      ).toBe(true);

      expect(
        stringsHelper.isEmail('user@test.com', {
          customDomain: ['mycompany', 'test'],
          customTLD: 'com',
        })
      ).toBe(true);
    });

    test('should reject emails with TLD when only custom domain is set', () => {
      expect(stringsHelper.isEmail('user@example.com', { customDomain: 'example' })).toBe(false);
    });

    test('should reject emails without TLD when only custom TLD is set', () => {
      expect(stringsHelper.isEmail('user@example', { customTLD: 'com' })).toBe(false);
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

    test('should return false for invalid strings', () => {
      expect(stringsHelper.isURL('')).toBe(false);
      expect(stringsHelper.isURL('   ')).toBe(false);
      expect(stringsHelper.isURL(null)).toBe(false);
      expect(stringsHelper.isURL(undefined)).toBe(false);
      expect(stringsHelper.isURL(123)).toBe(false);
      expect(stringsHelper.isURL({})).toBe(false);
      expect(stringsHelper.isURL([])).toBe(false);
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

    test('should return false for invalid numbers', () => {
      expect(stringsHelper.isPhoneNumber('')).toBe(false);
      expect(stringsHelper.isPhoneNumber('   ')).toBe(false);
      expect(stringsHelper.isPhoneNumber(null)).toBe(false);
      expect(stringsHelper.isPhoneNumber(undefined)).toBe(false);
      expect(stringsHelper.isPhoneNumber(123)).toBe(false);
      expect(stringsHelper.isPhoneNumber({})).toBe(false);
      expect(stringsHelper.isPhoneNumber([])).toBe(false);
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

    test('should return false for invalid strings', () => {
      expect(stringsHelper.isPalindrome('')).toBe(false);
      expect(stringsHelper.isPalindrome('   ')).toBe(false);
      expect(stringsHelper.isPalindrome(null)).toBe(false);
      expect(stringsHelper.isPalindrome(undefined)).toBe(false);
      expect(stringsHelper.isPalindrome(123)).toBe(false);
      expect(stringsHelper.isPalindrome({})).toBe(false);
      expect(stringsHelper.isPalindrome([])).toBe(false);
    });
  });
});
