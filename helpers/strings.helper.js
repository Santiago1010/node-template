// =============================================================================
// STRING HELPER - Utilities for string manipulation and text processing
// =============================================================================
// Module providing comprehensive utilities for string operations, validation,
// formatting, transformation, and text processing functions.
//
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

/**
 * Checks if a given string consists of only numeric characters (0-9).
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if consists of only numeric characters, false otherwise
 *
 * @example
 * isNumericOnly('123456') // true
 * isNumericOnly('Hello123 World') // false
 * isNumericOnly('   ') // false
 */
const isNumericOnly = (str) => {
  return isValidString(str) && STRING_CONSTANTS.NUMERIC_ONLY.test(str);
};

/**
 * Checks if a given string consists of only alphanumeric characters (a-zA-Z0-9).
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if consists of only alphanumeric characters, false otherwise
 *
 * @example
 * isAlphanumeric('HelloWorld123') // true
 * isAlphanumeric('Hello123 World') // true
 * isAlphanumeric('   ') // false
 */
const isAlphanumeric = (str) => {
  return isValidString(str) && STRING_CONSTANTS.ALPHANUMERIC.test(str);
};

/**
 * Checks if a given string is a valid email address
 *
 * @param {string} email - The string to check
 * @param {{ customDomain?: string|string[], customTLD?: string|string[] }} [options] - Options for customizing the email address validation
 * @param {string|string[]} [options.customDomain] - A custom domain or an array of custom domains to allow
 * @param {string|string[]} [options.customTLD] - A custom top-level domain or an array of custom top-level domains to allow
 * @returns {boolean} True if valid email address, false otherwise
 *
 * @example
 * isEmail('user@example.com') // true
 * isEmail('user@example', { customDomain: 'example' }) // true
 * isEmail('user@example', { customDomain: ['example', 'test'] }) // true
 * isEmail('user@example', { customTLD: 'com' }) // true
 * isEmail('user@example', { customTLD: ['com', 'net'] }) // true
 * isEmail('user@example') // false
 */
const isEmail = (email, { customDomain, customTLD } = {}) => {
  if (!isValidString(email)) return false;

  let emailRegex = STRING_CONSTANTS.EMAIL_PATTERN;

  if (customDomain) {
    const domains = Array.isArray(customDomain) ? customDomain : [customDomain];
    const domainRegexPart = domains.map((domain) => domain.replace(/\./g, '\\.')).join('|');
    if (customTLD) {
      const tlds = Array.isArray(customTLD) ? customTLD : [customTLD];
      const tldRegexPart = tlds.map((tld) => tld.replace(/\./g, '\\.')).join('|');
      emailRegex = new RegExp(`^[^\\s@]+@(${domainRegexPart})\\.(${tldRegexPart})$`);
    } else {
      emailRegex = new RegExp(`^[^\\s@]+@(${domainRegexPart})$`);
    }
  } else if (customTLD) {
    const tlds = Array.isArray(customTLD) ? customTLD : [customTLD];
    const tldRegexPart = tlds.map((tld) => tld.replace(/\./g, '\\.')).join('|');
    emailRegex = new RegExp(`^[^\\s@]+@[^\\s@]+\\.(${tldRegexPart})$`);
  }

  return emailRegex.test(email);
};

/**
 * Checks if a given string is a valid URL
 *
 * @param {string} url - The string to check
 * @returns {boolean} True if valid URL, false otherwise
 *
 * @example
 * isURL('https://example.com') // true
 * isURL('http://example.com') // true
 * isURL('example.com') // true
 * isURL('https://example.com:8080') // true
 * isURL('ftp://example.com') // false
 * isURL('user:pass@example.com') // false
 * isURL('user:pass:8080@example.com') // false
 */
const isURL = (url) => {
  if (!isValidString(url)) return false;
  const urlPattern =
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return urlPattern.test(url);
};

/**
 * Checks if a given string is a valid phone number
 *
 * @param {string} phone - The string to check
 * @returns {boolean} True if valid phone number, false otherwise
 *
 * @example
 * isPhoneNumber('+1 (123) 456-7890') // true
 * isPhoneNumber('1234567890') // true
 * isPhoneNumber('+1234567890') // true
 * isPhoneNumber('1234567890123') // false
 * isPhoneNumber('1234567890abc') // false
 */
const isPhoneNumber = (phone) => {
  if (!isValidString(phone)) return false;
  const phonePattern = /^\+?(\d{1,3})?[-\.( ]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})$/;
  return phonePattern.test(phone.replace(/\s/g, ''));
};

/**
 * Checks if a given string is a palindrome
 *
 * @param {string} str - The string to check
 * @param {boolean} [ignoreSpaces=true] - Whether to ignore spaces in the check
 * @returns {boolean} True if string is a palindrome, false otherwise
 *
 * @example
 * isPalindrome('madam') // true
 * isPalindrome('Madam') // true
 * isPalindrome('A man, a plan, a canal: Panama') // true
 * isPalindrome('Not a palindrome') // false
 */
const isPalindrome = (str, ignoreSpaces = true) => {
  if (!isValidString(str)) return false;

  let cleanStr = str.toLowerCase();

  if (ignoreSpaces) cleanStr = cleanStr.replace(/[^a-z0-9]/g, '');

  return cleanStr === cleanStr.split('').reverse().join('');
};

// =============================================================================
// BASIC STRING OPERATIONS
// =============================================================================

/**
 * Counts the occurrences of a given substring in a given string.
 *
 * @param {string} str - The string to search
 * @param {string} subStr - The substring to search for
 * @param {boolean} [caseSensitive=true] - Whether to perform the search case-sensitively
 * @returns {number} The number of occurrences found
 *
 * @example
 * countOccurrences('The quick brown fox jumps over the lazy dog', 'the') // 2
 * countOccurrences('The quick brown fox jumps over the lazy dog', 'THE', false) // 2
 * countOccurrences('The quick brown fox jumps over the lazy dog', 'fox') // 1
 * countOccurrences('The quick brown fox jumps over the lazy dog', 'elephant') // 0
 */
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

/**
 * Reverses a given string.
 *
 * @param {string} str - The string to reverse
 * @returns {string|null} The reversed string, or null on error
 *
 * @example
 * reverseString('The quick brown fox') // 'xof nworb kciuq ehT'
 */
const reverseString = (str) => {
  if (!isValidString(str)) {
    cerror('Reverse String', 'Invalid string provided');
    return null;
  }

  return str.split('').reverse().join('');
};

/**
 * Removes all whitespace characters from a given string.
 *
 * @param {string} str - The string to remove whitespace from
 * @returns {string|null} The string with all whitespace characters removed, or null on error
 *
 * @example
 * removeWhitespace('   The   quick   brown   fox   ') // 'The quick brown fox'
 */
const removeWhitespace = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Whitespace', 'Invalid string provided');
    return null;
  }

  return str.replace(STRING_CONSTANTS.WHITESPACE, '');
};

/**
 * Replaces all special characters in a given string with a space, and then removes duplicate spaces and trims the string.
 *
 * @param {string} str - The string to remove special characters from
 * @returns {string|null} The string with special characters removed, or null on error
 *
 * @example
 * removeSpecialChars('Th?, qu?ck br?wn fox') // 'The quick brown fox'
 */
const removeSpecialChars = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Special Characters', 'Invalid string provided');
    return null;
  }

  return str.replace(STRING_CONSTANTS.SPECIAL_CHARS, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Truncates a given string to a specified maximum length, appending an ellipsis if the string is longer than the maximum length.
 *
 * @param {string} str - The string to truncate
 * @param {number} [maxLength=50] - The maximum length of the string
 * @param {string} [ellipsis='...'] - The string to append to the end of the truncated string
 * @returns {string|null} The truncated string, or null on error
 *
 * @example
 * truncateString('The quick brown fox jumped over the lazy dog', 19) // 'The quick brown...'
 */
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

/**
 * Extracts an array of words from a given string, optionally converting them to lowercase.
 *
 * @param {string} str - The string to extract words from
 * @param {boolean} [toLowerCase=false] - If true, the words will be converted to lowercase
 * @returns {string[]|null} The array of words, or null on error
 *
 * @example
 * extractWords('The quick brown fox') // ['The', 'quick', 'brown', 'fox']
 * extractWords('The quick brown fox', true) // ['the', 'quick', 'brown', 'fox']
 */
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

/**
 * Capitalizes the first letter of each word in a given string, and returns the modified string.
 *
 * @param {string} str - The string to capitalize
 * @returns {string|null} The capitalized string, or null on error
 *
 * @example
 * formatCapitalize('the quick brown fox') // 'The Quick Brown Fox'
 */
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

/**
 * Takes a string name and returns a cleaned, capitalized version of the name.
 * Null, undefined, or empty strings will be returned as null.
 * If the name is not null or undefined, the function will remove any occurrences of
 * "null" or "undefined" from the name, collapse any multiple spaces into single spaces,
 * and trim any leading or trailing whitespace. The name will then be capitalized and
 * returned.
 *
 * @param {string} name - The string name to clean and capitalize
 * @returns {string|null} The cleaned and capitalized name, or null if the input is null or undefined
 */
const formatNames = (name) => {
  if (!name || typeof name !== 'string') return null;

  const cleanedName = name
    .replace(/\b(?:Null|Undefined|null|undefined)\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleanedName ? formatCapitalize(cleanedName) : null;
};

/**
 * Converts a string to title case.
 *
 * @param {string} str - The string to convert
 * @param {string[]} [exceptions=STRING_CONSTANTS.TITLE_CASE_EXCEPTIONS] - Words to not capitalize
 * @returns {string|null} The converted string, or null on error
 *
 * @example
 * toTitleCase('the quick brown fox') // 'The Quick Brown Fox'
 * toTitleCase('the quick brown fox', ['the', 'a', 'an']) // 'The quick brown Fox'
 */
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

/**
 * Replaces common escape sequences in a string with their respective literal characters.
 *
 * Replaces the following escape sequences:
 *   - `\n` with a newline character
 *   - `\t` with a tab character
 *   - `\'` with a single quote character
 *   - `\"` with a double quote character
 *   - `\/` with a forward slash character
 *   - `\b` with a backspace character
 *   - `\f` with a form feed character
 *   - `\r` with a carriage return character
 *
 * If an escape sequence is not recognized, it is left as is.
 *
 * @param {string} inputText - The string to process
 * @returns {string|null} The processed string, or null if the input is invalid
 *
 * @example
 * formatEscapeSequences('This\nis\na\ntest') // 'This\nis\na\ntest'
 */
const formatEscapeSequences = (inputText) => {
  if (!inputText) return null;

  if (typeof inputText !== 'string') throw new TypeError('inputText must be a string');

  return inputText.replace(/\\([nt'"\\/bfr])/g, (match, character) => {
    return ESCAPE_SEQUENCES[character] || match;
  });
};

/**
 * Wraps a given string to a specified width by inserting line breaks.
 *
 * @param {string} text - The string to wrap
 * @param {number} [width=STRING_CONSTANTS.DEFAULT_WORD_WRAP_WIDTH] - The maximum width of each line
 * @returns {string|null} The wrapped string, or null if the input is invalid
 *
 * @example
 * wrapText('This is a very long string that needs to be wrapped to a certain width.') // 'This is a very\nlong string that\nneeds to be\nwrapped to a\ncertain width.'
 */
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

/**
 * Converts a given string to camelCase.
 *
 * @param {string} str - The string to convert
 * @returns {string|null} The camelCased string, or null if the input is invalid
 *
 * @example
 * toCamelCase('hello world') // 'helloWorld'
 * toCamelCase('hello_world') // 'helloWorld'
 * toCamelCase('hello-world') // 'helloWorld'
 * toCamelCase('hello World') // 'helloWorld'
 */
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

/**
 * Converts a given string to PascalCase.
 *
 * @param {string} str - The string to convert
 * @returns {string|null} The PascalCased string, or null if the input is invalid
 *
 * @example
 * toPascalCase('hello world') // 'HelloWorld'
 * toPascalCase('hello_world') // 'HelloWorld'
 * toPascalCase('hello-world') // 'HelloWorld'
 * toPascalCase('hello World') // 'HelloWorld'
 */
const toPascalCase = (str) => {
  const camelCased = toCamelCase(str);
  return camelCased ? camelCased.charAt(0).toUpperCase() + camelCased.slice(1) : null;
};

/**
 * Converts a given string to snake_case.
 *
 * @param {string} str - The string to convert
 * @returns {string|null} The snake_cased string, or null if the input is invalid
 *
 * @example
 * toSnakeCase('hello world') // 'hello_world'
 * toSnakeCase('hello_world') // 'hello_world'
 * toSnakeCase('hello-world') // 'hello_world'
 * toSnakeCase('hello World') // 'hello_world'
 */
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

/**
 * Converts a given string to kebab-case.
 *
 * @param {string} str - The string to convert
 * @returns {string|null} The kebab-cased string, or null if the input is invalid
 *
 * @example
 * toKebabCase('hello world') // 'hello-world'
 * toKebabCase('hello_world') // 'hello-world'
 * toKebabCase('hello-world') // 'hello-world'
 * toKebabCase('hello World') // 'hello-world'
 */
const toKebabCase = (str) => {
  const snakeCased = toSnakeCase(str);
  return snakeCased ? snakeCased.replace(/_/g, '-') : null;
};

/**
 * Converts a given string to SCREAMING_SNAKE_CASE.
 *
 * @param {string} str - The string to convert
 * @returns {string|null} The SCREAMING_SNAKE_CASEd string, or null if the input is invalid
 *
 * @example
 * toScreamingSnakeCase('hello world') // 'HELLO_WORLD'
 * toScreamingSnakeCase('hello_world') // 'HELLO_WORLD'
 * toScreamingSnakeCase('hello-world') // 'HELLO_WORLD'
 * toScreamingSnakeCase('hello World') // 'HELLO_WORLD'
 */
const toScreamingSnakeCase = (str) => {
  const snakeCased = toSnakeCase(str);
  return snakeCased ? snakeCased.toUpperCase() : null;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Returns a string consisting of a specified number of newline characters.
 *
 * @param {number} [count=1] - The number of newline characters to return
 * @returns {string} A string consisting of `count` newline characters
 *
 * @example
 * newlines() // '\n'
 * newlines(2) // '\n\n'
 */
const newlines = (count = 1) => {
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    throw new Error('Invalid count: must be a non-negative integer');
  }

  return '\n'.repeat(count);
};

/**
 * Returns a string consisting of a specified number of tab characters.
 *
 * @param {number} [count=1] - The number of tab characters to return
 * @returns {string} A string consisting of `count` tab characters
 *
 * @example
 * tabs() // '\t'
 * tabs(2) // '\t\t'
 */
const tabs = (count = 1) => {
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    throw new Error('Invalid count: must be a non-negative integer');
  }

  return '\t'.repeat(count);
};

/**
 * Returns a string consisting of a specified number of spaces.
 *
 * @param {number} [count=1] - The number of spaces to return
 * @returns {string} A string consisting of `count` spaces
 *
 * @example
 * spaces() // ' '
 * spaces(2) // '  '
 */
const spaces = (count = 1) => {
  if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
    throw new Error('Invalid count: must be a non-negative integer');
  }

  return ' '.repeat(count);
};

/**
 * Repeats a given string a specified number of times, optionally with a separator.
 *
 * @param {string} str - The string to repeat
 * @param {number} count - The number of times to repeat the string
 * @param {string} [separator=''] - The separator to use when joining the repeated strings
 * @returns {string|null} The repeated string, or null if the input is invalid
 *
 * @example
 * repeatString('hello', 3) // 'hellohellohello'
 * repeatString('hello', 3, ' ') // 'hello hello hello'
 * repeatString('hello', 3, ', ') // 'hello, hello, hello'
 */
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

/**
 * Calculates the Levenshtein Distance between two strings, which is the minimum number
 * of operations (insertions, deletions, and substitutions) required to transform one
 * string into another.
 *
 * @param {string} str1 - The first string
 * @param {string} str2 - The second string
 * @returns {number|null} The Levenshtein Distance between the two strings, or null if the input is invalid
 *
 * @example
 * levenshteinDistance('kitten', 'sitting') // 3
 */
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

/**
 * Calculates a similarity score between two strings, which is a measure of how
 * similar the two strings are. The score is expressed as a percentage between 0
 * and 100. The algorithm used is based on the Levenshtein Distance.
 *
 * @param {string} str1 - The first string
 * @param {string} str2 - The second string
 * @returns {number|null} The similarity score as a percentage, or null if the input is invalid
 *
 * @example
 * stringSimilarity('kitten', 'sitting') // 66.67
 */
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

/**
 * Finds the longest common subsequence between two strings.
 *
 * @param {string} str1 - The first string
 * @param {string} str2 - The second string
 * @returns {string|null} The longest common subsequence, or null if the input is invalid
 *
 * @example
 * longestCommonSubsequence('abcde', 'ace') // 'ace'
 * longestCommonSubsequence('abcde', 'xyz') // ''
 */
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

/**
 * Removes all diacritics from a given string.
 *
 * @param {string} str - The string to remove diacritics from
 * @returns {string} The string with all diacritics removed, or null if the input is invalid
 *
 * @example
 * removeDiacritics('H llo W rld') // 'Hello World'
 */
const removeDiacritics = (str) => {
  if (!isValidString(str)) {
    cerror('Remove Diacritics', 'Invalid string provided');
    return null;
  }

  return str.normalize('NFD').replace(STRING_CONSTANTS.DIACRITICS, '');
};

/**
 * Generates a slug from a given string.
 *
 * @param {string} str - The string to generate a slug from
 * @param {{ separator: string, lowercase: boolean, maxLength: number }} [options] - Optional settings
 * @param {string} [options.separator='-'] - The separator to use in the slug
 * @param {boolean} [options.lowercase=true] - Whether to convert the slug to lowercase
 * @param {number} [options.maxLength] - The maximum length of the slug
 * @returns {string|null} The generated slug, or null if the input is invalid
 *
 * @example
 * generateSlug('Hello World') // 'hello-world'
 * generateSlug('Hello World', { separator: '_', lowercase: false }) // 'Hello_World'
 * generateSlug('Hello World', { maxLength: 10 }) // 'hello-world'
 */
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

/**
 * Masks a given string, leaving only a specified number of characters visible
 * at the start and end of the string.
 *
 * @param {string} str - The string to mask
 * @param {{ visibleStart: number, visibleEnd: number, maskChar: string }} [options] - Optional settings
 * @param {number} [options.visibleStart=2] - The number of characters to leave visible at the start of the string
 * @param {number} [options.visibleEnd=2] - The number of characters to leave visible at the end of the string
 * @param {string} [options.maskChar='*'] - The character to use for masking
 * @returns {string|null} The masked string, or null if the input is invalid
 *
 * @example
 * maskString('Hello World') // 'He******ld'
 * maskString('Hello World', { visibleStart: 3, visibleEnd: 3 }) // 'Hel******ld'
 * maskString('Hello World', { maskChar: 'x' }) // 'Hx******ld'
 */
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

/**
 * Extracts all substrings between two delimiters from a given string.
 *
 * @param {string} str - The string to extract from
 * @param {string} startDelimiter - The start delimiter
 * @param {string} endDelimiter - The end delimiter
 * @param {boolean} [includeDelimiters=false] - Whether to include delimiters in the extracted strings
 * @returns {string[]|null} The extracted strings, or null if the input is invalid
 *
 * @example
 * extractBetween('Hello World', '<', '>') // ['Hello', 'World']
 * extractBetween('Hello World', '<', '>', true) // ['<Hello>', '<World>']
 */
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

/**
 * Counts the number of words in a given string, optionally excluding numbers.
 *
 * @param {string} str - The string to count words from
 * @param {{ excludeNumbers: boolean }} [options] - Optional settings
 * @param {boolean} [options.excludeNumbers=false] - Whether to exclude numbers from the count
 * @returns {number|null} The number of words, or null if the input is invalid
 *
 * @example
 * countWords('The quick brown fox') // 9
 * countWords('The quick brown fox', { excludeNumbers: true }) // 6
 */
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

  // String Generation Utilities
  newlines,
  tabs,
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
