// =============================================================================
// UTILITIES HELPER - General utility functions for common operations
// =============================================================================
//
// This module provides a comprehensive set of utility functions for common
// programming tasks including array operations, object manipulation, type
// checking, validation, functional programming helpers, and more.
//
// =============================================================================

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const moment = require('moment');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const { cerror } = require('./debug.helper');

// =============================================================================
// ARRAY MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Converts a string or array to an array with various transformation options.
 *
 * @param {string|Array} input - The string or array to convert
 * @param {string} [separator=' '] - The separator to use when splitting a string
 * @param {Object} [options] - Configuration options for the conversion
 * @param {boolean} [options.numberElements=false] - Convert string elements to numbers if possible
 * @param {boolean} [options.uniqueElements=false] - Remove duplicate elements from the array
 * @param {boolean} [options.trimElements=true] - Trim whitespace from string elements
 * @returns {Array|null} The converted array, or null if input is invalid
 *
 * @example
 * stringToArray('hello world') // ['hello', 'world']
 * stringToArray('1,2,3', ',', { numberElements: true }) // [1, 2, 3]
 * stringToArray('a,a,b', ',', { uniqueElements: true }) // ['a', 'b']
 */
const stringToArray = (
  input,
  separator = ' ',
  { numberElements = false, uniqueElements = false, trimElements = true } = {}
) => {
  let array = null;

  if (Array.isArray(input)) {
    array = [...input]; // Create a copy
  } else if (typeof input === 'string') {
    array = input.split(separator);
  } else {
    cerror('String To Array', 'Invalid input: must be string or array');
    return null;
  }

  if (trimElements) {
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

/**
 * Converts an array to a human-readable string with proper conjunctions.
 *
 * @param {Array} array - The array to convert
 * @param {string} [conjunction='and'] - The conjunction to use for joining
 * @returns {string|null} The string representation, or null if input is invalid
 *
 * @example
 * arrayToString(['hello', 'world']) // 'hello and world'
 * arrayToString(['a', 'b', 'c'], 'or') // 'a, b or c'
 */
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

/**
 * Chunks an array into smaller arrays of specified size.
 *
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array|null} Array of chunks, or null if invalid input
 *
 * @example
 * chunkArray([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
const chunkArray = (array, size) => {
  if (!Array.isArray(array) || size <= 0) {
    cerror('Chunk Array', 'Invalid input: array must be an array and size must be positive');
    return null;
  }

  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
};

/**
 * Flattens a nested array to a specified depth.
 *
 * @param {Array} array - The array to flatten
 * @param {number} [depth=1] - The depth to flatten
 * @returns {Array|null} The flattened array, or null if invalid input
 *
 * @example
 * flattenArray([1, [2, [3, 4]]]) // [1, 2, [3, 4]]
 * flattenArray([1, [2, [3, 4]]], 2) // [1, 2, 3, 4]
 */
const flattenArray = (array, depth = 1) => {
  if (!Array.isArray(array)) {
    cerror('Flatten Array', 'Invalid input: must be an array');
    return null;
  }

  return array.flat(depth);
};

/**
 * Shuffles an array using Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle
 * @returns {Array|null} A new shuffled array, or null if invalid input
 *
 * @example
 * shuffleArray([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4] (random order)
 */
const shuffleArray = (array) => {
  if (!Array.isArray(array)) {
    cerror('Shuffle Array', 'Invalid input: must be an array');
    return null;
  }

  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

// =============================================================================
// OBJECT MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Deeply clones an object or array.
 *
 * @param {*} obj - The object to clone
 * @returns {*} A deep copy of the object
 *
 * @example
 * deepClone({ a: 1, b: { c: 2 } }) // { a: 1, b: { c: 2 } }
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (obj instanceof Date) return new Date(obj.getTime());

  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  if (typeof obj === 'object') {
    const cloned = {};

    Object.keys(obj).forEach((key) => {
      cloned[key] = deepClone(obj[key]);
    });

    return cloned;
  }
};

/**
 * Merges multiple objects deeply.
 *
 * @param {...Object} objects - Objects to merge
 * @returns {Object} The merged object
 *
 * @example
 * deepMerge({ a: 1 }, { b: 2 }, { a: 3 }) // { a: 3, b: 2 }
 */
const deepMerge = (...objects) => {
  const result = {};

  objects.forEach((obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          result[key] = deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      });
    }
  });

  return result;
};

/**
 * Gets a value from an object using dot notation path.
 *
 * @param {Object} obj - The object to get value from
 * @param {string} path - The dot notation path
 * @param {*} [defaultValue=undefined] - Default value if path not found
 * @returns {*} The value at the path or default value
 *
 * @example
 * getNestedValue({ a: { b: { c: 42 } } }, 'a.b.c') // 42
 * getNestedValue({ a: 1 }, 'a.b.c', 'default') // 'default'
 */
const getNestedValue = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof path !== 'string') return defaultValue;

  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

/**
 * Sets a value in an object using dot notation path.
 *
 * @param {Object} obj - The object to set value in
 * @param {string} path - The dot notation path
 * @param {*} value - The value to set
 * @returns {Object|null} The modified object, or null if invalid input
 *
 * @example
 * setNestedValue({}, 'a.b.c', 42) // { a: { b: { c: 42 } } }
 */
const setNestedValue = (obj, path, value) => {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') {
    cerror('Set Nested Value', 'Invalid input: obj must be object and path must be string');
    return null;
  }

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
};

// =============================================================================
// TYPE CHECKING AND VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a value is empty (null, undefined, empty string, array, or object).
 *
 * @param {*} value - The value to check
 * @returns {boolean} True if value is empty
 *
 * @example
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty(null) // true
 * isEmpty('hello') // false
 */
const isEmpty = (value) => {
  if (value == null) return true;

  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;

  if (typeof value === 'object') return Object.keys(value).length === 0;

  return false;
};

/**
 * Checks if a value is a plain object (not an array, function, etc.).
 *
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a plain object
 *
 * @example
 * isPlainObject({}) // true
 * isPlainObject([]) // false
 * isPlainObject(null) // false
 */
const isPlainObject = (value) => {
  return value !== null && typeof value === 'object' && value.constructor === Object;
};

// =============================================================================
// FUNCTIONAL PROGRAMMING HELPERS
// =============================================================================

/**
 * Creates a debounced function that delays invoking until after delay milliseconds.
 *
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced function
 *
 * @example
 * const debouncedLog = debounce(console.log, 300);
 * debouncedLog('hello'); // Will only log after 300ms of no more calls
 */
const debounce = (func, delay) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Creates a throttled function that only invokes at most once per every wait milliseconds.
 *
 * @param {Function} func - The function to throttle
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The throttled function
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
const throttle = (func, wait) => {
  let lastTime = 0;

  return (...args) => {
    const now = moment().valueOf();

    if (now - lastTime >= wait) {
      lastTime = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Composes multiple functions from right to left.
 *
 * @param {...Function} functions - Functions to compose
 * @returns {Function} The composed function
 *
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const composed = compose(double, addOne);
 * composed(3); // 8 (double(addOne(3)))
 */
const compose = (...functions) => {
  return (value) => functions.reduceRight((acc, fn) => fn(acc), value);
};

/**
 * Pipes a value through multiple functions from left to right.
 *
 * @param {*} value - The initial value
 * @param {...Function} functions - Functions to pipe through
 * @returns {*} The final transformed value
 *
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * pipe(3, addOne, double); // 8 ((3 + 1) * 2)
 */
const pipe = (value, ...functions) => {
  return functions.reduce((acc, fn) => fn(acc), value);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a random string of specified length.
 *
 * @param {number} [length=8] - The length of the random string
 * @param {string} [chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'] - Characters to use
 * @returns {string} The random string
 *
 * @example
 * randomString(10) // 'aBc3Def7Hi'
 * randomString(5, '012345') // '31204'
 */
const randomString = (length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

/**
 * Generates a UUID v4.
 *
 * @returns {string} A UUID v4 string
 *
 * @example
 * generateUUID() // '123e4567-e89b-12d3-a456-426614174000'
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Sleeps for a specified number of milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} A promise that resolves after the specified time
 *
 * @example
 * await sleep(1000); // Wait for 1 second
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize
 * @returns {string|null} The capitalized string, or null if invalid input
 *
 * @example
 * capitalize('hello world') // 'Hello world'
 */
const capitalize = (str) => {
  if (typeof str !== 'string') {
    cerror('Capitalize', 'Invalid input: must be a string');
    return null;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts a value to a boolean with flexible interpretation.
 *
 * @param {*} value - The value to convert
 * @returns {boolean} The boolean representation
 *
 * @example
 * toBoolean('true') // true
 * toBoolean('false') // false
 * toBoolean('yes') // true
 * toBoolean('no') // false
 * toBoolean(1) // true
 * toBoolean(0) // false
 */
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }

  if (typeof value === 'number') return value !== 0;

  return Boolean(value);
};

/**
 * Retries a function with exponential backoff.
 *
 * @param {Function} fn - The function to retry
 * @param {number} [maxAttempts=3] - Maximum number of attempts
 * @param {number} [baseDelay=1000] - Base delay in milliseconds
 * @returns {Promise} A promise that resolves with the function result or rejects after max attempts
 *
 * @example
 * const result = await retry(() => fetchData(), 3, 1000);
 */
const retry = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Array Manipulation Functions
  stringToArray,
  arrayToString,
  chunkArray,
  flattenArray,
  shuffleArray,

  // Object Manipulation Functions
  deepClone,
  deepMerge,
  getNestedValue,
  setNestedValue,

  // Type Checking and Validation Functions
  isEmpty,
  isPlainObject,

  // Functional Programming Helpers
  debounce,
  throttle,
  compose,
  pipe,

  // Utility Functions
  randomString,
  generateUUID,
  sleep,
  capitalize,
  toBoolean,
  retry,
};
