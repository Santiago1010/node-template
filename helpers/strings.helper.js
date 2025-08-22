// =============================================================================
// STRING HELPER - Utilities for string manipulation and text processing
// =============================================================================
// Module providing comprehensive utilities for string operations, validation,
// formatting, transformation, and text processing functions.
//
// @version 2.0.0
// @author Your Name
// @created 2025-08-22
// =============================================================================

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const { cerror } = require('./debug.helper');
const { ESCAPE_SEQUENCES, STRING_CONSTANTS } = require('./constants.helper');

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a given value is a valid string (not null, not undefined, not empty)
 *
 * @param {any} value - The value to check
 * @returns {boolean} True if valid string, false otherwise
 *
 * @example
 * isValidString('Hello World') // true
 * isValidString(null)          // false
 * isValidString(undefined)     // false
 * isValidString('   ')         // false
 */
const isValidString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Checks if a given string consists of only alphabetic characters (a-zA-Z).
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if consists of only alphabetic characters, false otherwise
 *
 * @example
 * isAlphaOnly('Hello World') // true
 * isAlphaOnly('Hello123 World') // false
 * isAlphaOnly('   ') // false
 */
const isAlphaOnly = (str) => {
  return isValidString(str) && STRING_CONSTANTS.ALPHA_ONLY.test(str);
};

const isNumericOnly = (str) => {
  return isValidString(str) && STRING_CONSTANTS.NUMERIC_ONLY.test(str);
};

const isAlphanumeric = (str) => {
  return isValidString(str) && STRING_CONSTANTS.ALPHANUMERIC.test(str);
};

const isEmail = (email, { customDomain, customTLD } = {}) => {
  if (!isValidString(email)) return false;

  let emailRegex = STRING_CONSTANTS.EMAIL_PATTERN;
  let domainRegexPart = '';
  let tldRegexPart = '';

  if (customDomain) {
    const domains = Array.isArray(customDomain) ? customDomain : [customDomain];
    domainRegexPart = domains.map((domain) => domain.replace(/\./g, '\\.')).join('|');
    emailRegex = new RegExp(`^[^\\s@]+@(${domainRegexPart})\\.[^\\s@]+$`);
  }

  if (customTLD) {
    const tlds = Array.isArray(customTLD) ? customTLD : [customTLD];
    tldRegexPart = tlds.map((tld) => tld.replace(/\./g, '\\.')).join('|');
    emailRegex = domainRegexPart
      ? new RegExp(`^[^\\s@]+@(${domainRegexPart})\\.(${tldRegexPart})$`)
      : new RegExp(`^[^\\s@]+@[^\\s@]+\\.(${tldRegexPart})$`);
  }

  return emailRegex.test(email);
};

const isURL = (url) => {
  return isValidString(url) && STRING_CONSTANTS.URL_PATTERN.test(url);
};

const isPhoneNumber = (phone) => {
  return isValidString(phone) && STRING_CONSTANTS.PHONE_PATTERN.test(phone);
};

const isEmpty = (str) => {
  return typeof str !== 'string' || str.trim().length === 0;
};

const isPalindrome = (str, ignoreSpaces = true) => {
  if (!isValidString(str)) return false;
  let cleanStr = str.toLowerCase();
  if (ignoreSpaces) cleanStr = cleanStr.replace(/[^a-z0-9]/g, '');
  return cleanStr === cleanStr.split('').reverse().join('');
};

// =============================================================================
// BASIC STRING OPERATIONS
// =============================================================================

const countOccurrences = (str, subStr, caseSensitive = true) => {
  if (typeof str !== 'string' || typeof subStr !== 'string') {
    throw new Error('Both "str" and "subStr" must be strings');
  }
  if (subStr.length === 0) return 0;

  let searchStr = caseSensitive ? str : str.toLowerCase();
  let searchSubStr = caseSensitive ? subStr : subStr.toLowerCase();

  let count = 0;
  let pos = searchStr.indexOf(searchSubStr);
  while (pos !== -1) {
    count++;
    pos = searchStr.indexOf(searchSubStr, pos + searchSubStr.length);
  }
  return count;
};

const reverseString = (str) => {
  if (!isValidString(str)) {
    cerror('Reverse String', 'Invalid string provided');
    return null;
  }
  return str.split('').reverse().join('');
};

const removeWhitespace = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Whitespace', 'Invalid string provided');
    return null;
  }
  return str.replace(STRING_CONSTANTS.WHITESPACE, '');
};

const removeSpecialChars = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Special Characters', 'Invalid string provided');
    return null;
  }
  return str.replace(STRING_CONSTANTS.SPECIAL_CHARS, ' ').replace(/\s+/g, ' ').trim();
};

const truncateString = (
  str,
  maxLength = STRING_CONSTANTS.DEFAULT_TRUNCATE_LENGTH,
  ellipsis = STRING_CONSTANTS.DEFAULT_ELLIPSIS
) => {
  if (!isValidString(str)) {
    cerror('Truncate String', 'Invalid string provided');
    return null;
  }
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
};

const extractWords = (str, toLowerCase = false) => {
  if (!isValidString(str)) {
    cerror('Extract Words', 'Invalid string provided');
    return null;
  }
  let words = str
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 0);
  return toLowerCase ? words.map((word) => word.toLowerCase()) : words;
};

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

const formatCapitalize = (str) => {
  if (!isValidString(str)) {
    cerror('Format Capitalize', 'Invalid string provided');
    return null;
  }
  return str
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatNames = (name) => {
  if (!name || typeof name !== 'string') return null;
  const cleanedName = name
    .replace(/\b(?:Null|Undefined|null|undefined)\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleanedName ? formatCapitalize(cleanedName) : null;
};

const toTitleCase = (str, exceptions = STRING_CONSTANTS.TITLE_CASE_EXCEPTIONS) => {
  if (!isValidString(str)) {
    cerror('To Title Case', 'Invalid string provided');
    return null;
  }
  const words = str.toLowerCase().split(' ');
  return words
    .map((word, index) => {
      if (index === 0 || index === words.length - 1 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

const formatEscapeSequences = (inputText) => {
  if (!inputText) return null;
  if (typeof inputText !== 'string') throw new TypeError('inputText must be a string');
  return inputText.replace(/\\(n|t|'|"|\/|b|f|r)/g, (match, character) => {
    return ESCAPE_SEQUENCES[character] || match;
  });
};

const wrapText = (text, width = STRING_CONSTANTS.DEFAULT_WORD_WRAP_WIDTH) => {
  if (!isValidString(text)) {
    cerror('Wrap Text', 'Invalid text provided');
    return null;
  }
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

// =============================================================================
// CASE CONVERSION FUNCTIONS
// =============================================================================

const toCamelCase = (str) => {
  if (!isValidString(str)) {
    cerror('To Camel Case', 'Invalid string provided');
    return null;
  }
  let cleanStr = str
    .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ_-]/g, '')
    .replace(/[-_]/g, ' ')
    .normalize('NFD')
    .replace(STRING_CONSTANTS.DIACRITICS, '');
  const words = cleanStr.split(' ').filter((word) => word.length > 0);
  if (words.length === 0) return '';
  return words
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
};

const toPascalCase = (str) => {
  const camelCased = toCamelCase(str);
  return camelCased ? camelCased.charAt(0).toUpperCase() + camelCased.slice(1) : null;
};

const toSnakeCase = (str) => {
  if (!isValidString(str)) {
    cerror('To Snake Case', 'Invalid string provided');
    return null;
  }
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ_-]/g, '')
    .replace(/[-\s]/g, '_')
    .normalize('NFD')
    .replace(STRING_CONSTANTS.DIACRITICS, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

const toKebabCase = (str) => {
  const snakeCased = toSnakeCase(str);
  return snakeCased ? snakeCased.replace(/_/g, '-') : null;
};

const toScreamingSnakeCase = (str) => {
  const snakeCased = toSnakeCase(str);
  return snakeCased ? snakeCased.toUpperCase() : null;
};

// =============================================================================
// ARRAY CONVERSION FUNCTIONS
// =============================================================================

const stringToArray = (
  input,
  separator = ' ',
  { numberElements = false, uniqueElements = false, trimElements = true } = {}
) => {
  let array = null;
  if (Array.isArray(input)) {
    array = input;
  } else if (typeof input === 'string') {
    array = input.split(separator);
  } else {
    cerror('String To Array', 'Invalid input: must be string or array');
    return null;
  }

  if (trimElements && !Array.isArray(input)) {
    array = array.map((element) => (typeof element === 'string' ? element.trim() : element));
  }
  if (numberElements) {
    array = array.map((element) => {
      if (typeof element === 'string') {
        const parsed = Number(element);
        return isNaN(parsed) ? element : parsed;
      }
      return element;
    });
  }
  if (uniqueElements) array = [...new Set(array)];
  return array;
};

const arrayToString = (array, conjunction = 'and') => {
  if (!Array.isArray(array)) {
    cerror('Array To String', 'Invalid input: must be an array');
    return null;
  }
  if (array.length === 0) return '';
  if (array.length === 1) return String(array[0]);
  if (array.length === 2) return `${array[0]} ${conjunction} ${array[1]}`;
  return `${array.slice(0, -1).join(', ')} ${conjunction} ${array[array.length - 1]}`;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const newlines = (count = 1) => {
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    throw new Error('Invalid count: must be a non-negative integer');
  }
  return '\n'.repeat(count);
};

const spaces = (count = 1) => {
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    throw new Error('Invalid count: must be a non-negative integer');
  }
  return ' '.repeat(count);
};

const repeatString = (str, count, separator = '') => {
  if (!isValidString(str)) {
    cerror('Repeat String', 'Invalid string provided');
    return null;
  }
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    cerror('Repeat String', 'Invalid count: must be a non-negative integer');
    return null;
  }
  return Array(count).fill(str).join(separator);
};

// =============================================================================
// ADVANCED STRING PROCESSING
// =============================================================================

const levenshteinDistance = (str1, str2) => {
  if (!isValidString(str1) || !isValidString(str2)) {
    cerror('Levenshtein Distance', 'Invalid strings provided');
    return null;
  }
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[str2.length][str1.length];
};

const stringSimilarity = (str1, str2) => {
  if (!isValidString(str1) || !isValidString(str2)) {
    cerror('String Similarity', 'Invalid strings provided');
    return null;
  }
  if (str1 === str2) return 100;
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 100 : Math.round(((maxLength - distance) / maxLength) * 10000) / 100;
};

const longestCommonSubsequence = (str1, str2) => {
  if (!isValidString(str1) || !isValidString(str2)) {
    cerror('Longest Common Subsequence', 'Invalid strings provided');
    return null;
  }
  const dp = Array(str1.length + 1)
    .fill(null)
    .map(() => Array(str2.length + 1).fill(''));
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + str1[i - 1];
      } else {
        dp[i][j] = dp[i - 1][j].length > dp[i][j - 1].length ? dp[i - 1][j] : dp[i][j - 1];
      }
    }
  }
  return dp[str1.length][str2.length];
};

const removeDiacritics = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Diacritics', 'Invalid string provided');
    return null;
  }
  return str.normalize('NFD').replace(STRING_CONSTANTS.DIACRITICS, '');
};

const generateSlug = (str, { separator = '-', lowercase = true, maxLength } = {}) => {
  if (!isValidString(str)) {
    cerror('Generate Slug', 'Invalid string provided');
    return null;
  }
  let slug = removeDiacritics(str);
  if (!slug) return null;
  slug = slug
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, separator);
  if (lowercase) slug = slug.toLowerCase();
  slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(new RegExp(`${separator}+$`), '');
  }
  return slug;
};

const maskString = (str, { visibleStart = 2, visibleEnd = 2, maskChar = '*' } = {}) => {
  if (!isValidString(str)) {
    cerror('Mask String', 'Invalid string provided');
    return null;
  }
  const length = str.length;
  if (length <= visibleStart + visibleEnd) return maskChar.repeat(length);
  return (
    str.substring(0, visibleStart) +
    maskChar.repeat(length - visibleStart - visibleEnd) +
    str.substring(length - visibleEnd)
  );
};

const extractBetween = (str, startDelimiter, endDelimiter, includeDelimiters = false) => {
  if (!isValidString(str) || !isValidString(startDelimiter) || !isValidString(endDelimiter)) {
    cerror('Extract Between', 'Invalid parameters provided');
    return null;
  }
  const results = [];
  let startIndex = 0;
  while (true) {
    const start = str.indexOf(startDelimiter, startIndex);
    if (start === -1) break;
    const end = str.indexOf(endDelimiter, start + startDelimiter.length);
    if (end === -1) break;
    results.push(
      includeDelimiters
        ? str.substring(start, end + endDelimiter.length)
        : str.substring(start + startDelimiter.length, end)
    );
    startIndex = end + endDelimiter.length;
  }
  return results;
};

const countWords = (str, { excludeNumbers = false } = {}) => {
  if (!isValidString(str)) {
    cerror('Count Words', 'Invalid string provided');
    return null;
  }
  const words = extractWords(str);
  return excludeNumbers ? words.filter((word) => !isNumericOnly(word)).length : words.length;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Validation Functions
  isValidString,
  isAlphaOnly,
  isNumericOnly,
  isAlphanumeric,
  isEmail,
  isURL,
  isPhoneNumber,
  isEmpty,
  isPalindrome,

  // Basic String Operations
  countOccurrences,
  reverseString,
  removeWhitespace,
  removeSpecialChars,
  truncateString,
  extractWords,
  countWords,

  // Text Formatting Functions
  formatCapitalize,
  formatNames,
  toTitleCase,
  formatEscapeSequences,
  wrapText,

  // Case Conversion Functions
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toScreamingSnakeCase,

  // Array Conversion Functions
  stringToArray,
  arrayToString,

  // String Generation Utilities
  newlines,
  spaces,
  repeatString,

  // Advanced String Processing
  levenshteinDistance,
  stringSimilarity,
  longestCommonSubsequence,
  removeDiacritics,
  generateSlug,
  maskString,
  extractBetween,
};
