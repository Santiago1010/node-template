// =============================================================================
// NUMBER UTILITIES - Comprehensive Number Manipulation and Validation
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides comprehensive number validation, conversion, and mathematical operations
// - Handles various number formats and edge cases with robust error handling
// - Offers financial formatting, statistical calculations, and unit conversions
//
// ARCHITECTURAL DECISIONS:
// - Functional programming approach for composability and testability
// - Separation of validation and computation logic for maintainability
// - Use of lodash for optimized array operations and mathematical functions
// - Consistent error handling with contextual error messages
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Could use class-based approach but chosen functional for simplicity
// - Considered using Big.js for precision but opted for native operations for performance
// - Evaluated third-party validation libraries but built custom for specific needs
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) for array operations, O(1) for single operations
// - Space complexity: Generally O(1) except for array operations (O(n))
// - Optimized for medium-sized datasets (up to 10,000 elements)
//
// SECURITY CONSIDERATIONS:
// - Input validation prevents injection attacks
// - Type coercion handled safely with explicit checks
// - No sensitive data exposure in error messages
//
// USAGE EXAMPLES:
// - Financial calculations and currency formatting
// - Data validation and sanitization
// - Statistical analysis and mathematical operations
//
// MAINTENANCE & TROUBLESHOOTING:
// - All functions validate inputs and provide meaningful error messages
// - Use cerror helper for consistent error reporting
// - Monitor precision limits in financial calculations
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ for Intl.NumberFormat and modern JS features
// - Lodash 4.17.21+ for utility functions
// - Browser compatible with polyfills for Intl API
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const _ = require('lodash'); // Utility functions for array operations and mathematics

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { NUMBER_CONSTANTS } = require('./constants.helper'); // Number-related constants
const { cerror } = require('./debug.helper'); // Error logging utility

/**
 * Converts input to number using unary plus operator
 *
 * @description Safely converts various input types to numbers. Note: This may return NaN for invalid inputs.
 * @param {*} input - Value to convert (string, number, boolean, etc.)
 * @returns {number} Converted number or NaN if conversion fails
 *
 * @example
 * // Basic conversion
 * convertToNumber("123"); // Returns 123
 * convertToNumber("abc"); // Returns NaN
 *
 * @complexity Time: O(1), Space: O(1)
 */
const convertToNumber = (input) => +input;

/**
 * Validates if input is a valid finite number
 *
 * @description Comprehensive validation supporting strings, numbers, and array inputs.
 *              Uses regex pattern from constants for string validation.
 * @param {*} input - Value to validate (number, string, array, null, undefined)
 * @returns {boolean} True if input is a valid finite number
 *
 * @example
 * isValidNumber(123); // true
 * isValidNumber("123.45"); // true
 * isValidNumber("abc"); // false
 * isValidNumber(null); // false
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isValidNumber = (input) => {
  if (typeof input === 'number') return isFinite(input);

  if (input == null || (Array.isArray(input) && input.length !== 1)) return false;

  if (typeof input === 'string') {
    if (!NUMBER_CONSTANTS.NUMBER_REGEX.test(input.trim())) return false;
  }

  const num = +input;
  return !isNaN(num) && isFinite(num);
};

/**
 * Filters and converts valid numbers from an array
 *
 * @description Internal utility function that extracts valid numbers from an array
 *              and converts them to numeric type
 * @param {Array} numbers - Array of values to filter and convert
 * @returns {Array} Array of valid numbers
 *
 * @example
 * getValidNumbers([1, "2", "abc", null]); // Returns [1, 2]
 *
 * @complexity Time: O(n), Space: O(n)
 * @private
 */
const getValidNumbers = (numbers) => {
  const result = [];
  for (let i = 0, len = numbers.length; i < len; i++) {
    if (isValidNumber(numbers[i])) {
      result.push(+numbers[i]);
    }
  }
  return result;
};

/**
 * Checks if a number is within specified range
 *
 * @description Validates if a number falls within inclusive min/max bounds
 * @param {number|string} num - Number to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if number is valid and within range
 *
 * @example
 * isInRange(5, 1, 10); // true
 * isInRange(15, 1, 10); // false
 * isInRange("5", 1, 10); // true
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isInRange = (num, min, max) => {
  if (!isValidNumber(num)) return false;
  const n = +num;
  return n >= min && n <= max;
};

/**
 * Validates if input is an integer
 *
 * @description Checks if input is a valid number and has no fractional component
 * @param {*} input - Value to check
 * @returns {boolean} True if input is a valid integer
 *
 * @example
 * isInteger(5); // true
 * isInteger(5.5); // false
 * isInteger("5"); // true
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isInteger = (input) => {
  if (!isValidNumber(input)) return false;
  const num = +input;
  return (num | 0) === num;
};

/**
 * Validates if input is a positive number
 *
 * @description Checks if input is a valid number and greater than zero
 * @param {*} input - Value to check
 * @returns {boolean} True if input is a valid positive number
 *
 * @example
 * isPositive(5); // true
 * isPositive(-5); // false
 * isPositive("5.5"); // true
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isPositive = (input) => isValidNumber(input) && +input > 0;

/**
 * Validates if input is an even integer
 *
 * @description Checks if input is a valid integer and divisible by 2
 * @param {*} input - Value to check
 * @returns {boolean} True if input is a valid even integer
 *
 * @example
 * isEven(4); // true
 * isEven(5); // false
 * isEven("4"); // true
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isEven = (input) => isInteger(input) && (+input & 1) === 0;

/**
 * Validates if input is an odd integer
 *
 * @description Checks if input is a valid integer and not divisible by 2
 * @param {*} input - Value to check
 * @returns {boolean} True if input is a valid odd integer
 *
 * @example
 * isOdd(5); // true
 * isOdd(4); // false
 * isOdd("5"); // true
 *
 * @complexity Time: O(1), Space: O(1)
 */
const isOdd = (input) => isInteger(input) && (+input & 1) === 1;

/**
 * Calculates sum of valid numbers
 *
 * @description Sums all valid numbers from provided arguments, ignoring invalid values
 * @param {...*} numbers - Numbers to sum (variable arguments)
 * @returns {number} Sum of valid numbers or 0 if no valid numbers
 *
 * @example
 * sumNumbers(1, 2, 3); // 6
 * sumNumbers(1, "2", "abc"); // 3
 * sumNumbers("abc", null); // 0
 *
 * @complexity Time: O(n), Space: O(n)
 */
const sumNumbers = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  return validNums.length === 0 ? 0 : _.sum(validNums);
};

/**
 * Calculates average of valid numbers
 *
 * @description Computes arithmetic mean of valid numbers, returns 0 if no valid numbers
 * @param {...*} numbers - Numbers to average (variable arguments)
 * @returns {number} Average of valid numbers or 0 if no valid numbers
 *
 * @example
 * average(1, 2, 3); // 2
 * average(1, "2", "abc"); // 1.5
 * average("abc", null); // 0
 *
 * @complexity Time: O(n), Space: O(n)
 */
const average = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  if (validNums.length === 0) {
    cerror('Calculate average', 'No valid numbers provided');
    return 0;
  }

  return _.mean(validNums);
};

/**
 * Finds maximum value among valid numbers
 *
 * @description Returns the largest valid number from provided arguments
 * @param {...*} numbers - Numbers to evaluate (variable arguments)
 * @returns {number|null} Maximum value or null if no valid numbers
 *
 * @example
 * maxNumber(1, 5, 3); // 5
 * maxNumber(1, "5", "abc"); // 5
 * maxNumber("abc", null); // null
 *
 * @complexity Time: O(n), Space: O(n)
 */
const maxNumber = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  if (validNums.length === 0) {
    cerror('Find maximum', 'No valid numbers provided');
    return null;
  }

  return _.max(validNums);
};

/**
 * Finds minimum value among valid numbers
 *
 * @description Returns the smallest valid number from provided arguments
 * @param {...*} numbers - Numbers to evaluate (variable arguments)
 * @returns {number|null} Minimum value or null if no valid numbers
 *
 * @example
 * minNumber(1, 5, 3); // 1
 * minNumber(1, "5", "abc"); // 1
 * minNumber("abc", null); // null
 *
 * @complexity Time: O(n), Space: O(n)
 */
const minNumber = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  if (validNums.length === 0) {
    cerror('Find minimum', 'No valid numbers provided');
    return null;
  }

  return _.min(validNums);
};

/**
 * Rounds number to specified decimal places
 *
 * @description Performs proper decimal rounding using mathematical rounding
 * @param {number|string} num - Number to round
 * @param {number} [decimals=NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES] - Decimal places
 * @returns {number|null} Rounded number or null for invalid parameters
 *
 * @example
 * roundToDecimal(1.2345, 2); // 1.23
 * roundToDecimal("1.2345", 2); // 1.23
 * roundToDecimal("abc", 2); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const roundToDecimal = (num, decimals = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(num) || !isValidNumber(decimals)) {
    cerror('Round decimal', 'Invalid parameters provided');
    return null;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(+num * factor) / factor;
};

/**
 * Rounds number up to nearest integer
 *
 * @description Performs ceiling operation (rounds up to next integer)
 * @param {number|string} num - Number to round up
 * @returns {number|null} Rounded number or null for invalid input
 *
 * @example
 * ceilNumber(1.2); // 2
 * ceilNumber("1.2"); // 2
 * ceilNumber("abc"); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const ceilNumber = (num) => {
  if (!isValidNumber(num)) {
    cerror('Round up', 'Invalid number provided');
    return null;
  }

  return Math.ceil(+num);
};

/**
 * Rounds number down to nearest integer
 *
 * @description Performs floor operation (rounds down to previous integer)
 * @param {number|string} num - Number to round down
 * @returns {number|null} Rounded number or null for invalid input
 *
 * @example
 * floorNumber(1.8); // 1
 * floorNumber("1.8"); // 1
 * floorNumber("abc"); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const floorNumber = (num) => {
  if (!isValidNumber(num)) {
    cerror('Round down', 'Invalid number provided');
    return null;
  }

  return Math.floor(+num);
};

/**
 * Generates random integer between min and max (inclusive)
 *
 * @description Creates cryptographically insecure but evenly distributed random integers
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number|null} Random integer or null for invalid parameters
 *
 * @example
 * getRandomNumber(1, 10); // Random integer between 1-10
 * getRandomNumber(5, 5); // 5
 * getRandomNumber(10, 1); // null (min > max)
 *
 * @complexity Time: O(1), Space: O(1)
 */
const getRandomNumber = (min, max) => {
  if (!isValidNumber(min) || !isValidNumber(max)) {
    cerror('Generate random number', 'Invalid min/max parameters');
    return null;
  }

  const minNum = +min;
  const maxNum = +max;

  if (minNum > maxNum) {
    cerror('Generate random number', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  // Optimized random generation
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
};

/**
 * Generates random float between min and max with specified decimals
 *
 * @description Creates cryptographically insecure random floats with precision control
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive for float, but rounded to decimals)
 * @param {number} [decimals=NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES] - Decimal precision
 * @returns {number|null} Random float or null for invalid parameters
 *
 * @example
 * getRandomFloat(1, 10, 2); // Random float between 1-10 with 2 decimals
 * getRandomFloat(1.5, 2.5); // Random float between 1.5-2.5
 * getRandomFloat(10, 1, 2); // null (min > max)
 *
 * @complexity Time: O(1), Space: O(1)
 */
const getRandomFloat = (min, max, decimals = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(min) || !isValidNumber(max) || !isValidNumber(decimals)) {
    cerror('Generate random decimal', 'Invalid parameters');
    return null;
  }

  const minNum = +min;
  const maxNum = +max;

  if (minNum > maxNum) {
    cerror('Generate random decimal', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  const random = Math.random() * (maxNum - minNum) + minNum;
  return roundToDecimal(random, decimals);
};

/**
 * Calculates percentage value (part/total * 100)
 *
 * @description Computes what percentage one number is of another
 * @param {number|string} part - The part value
 * @param {number|string} total - The total value
 * @returns {number|null} Percentage value or null for invalid parameters/division by zero
 *
 * @example
 * calculatePercentage(25, 100); // 25
 * calculatePercentage(3, 9); // 33.33 (with default 2 decimals)
 * calculatePercentage(5, 0); // null (division by zero)
 *
 * @complexity Time: O(1), Space: O(1)
 */
const calculatePercentage = (part, total) => {
  if (!isValidNumber(part) || !isValidNumber(total)) {
    cerror('Calculate percentage', 'Invalid parameters provided');
    return null;
  }

  const totalNum = +total;
  if (totalNum === 0) {
    cerror('Calculate percentage', 'Division by zero: total cannot be 0');
    return null;
  }

  return roundToDecimal((+part / totalNum) * 100);
};

/**
 * Calculates value from percentage
 *
 * @description Computes the actual value represented by a percentage of a total
 * @param {number|string} percentage - The percentage value
 * @param {number|string} total - The total value
 * @returns {number|null} Calculated value or null for invalid parameters
 *
 * @example
 * calculatePercentageValue(25, 100); // 25
 * calculatePercentageValue(10, 50); // 5
 * calculatePercentageValue("abc", 50); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const calculatePercentageValue = (percentage, total) => {
  if (!isValidNumber(percentage) || !isValidNumber(total)) {
    cerror('Calculate percentage value', 'Invalid parameters provided');
    return null;
  }

  return roundToDecimal((+percentage * +total) / 100);
};

/**
 * Calculates percentage change between two values
 *
 * @description Computes relative change from old value to new value as percentage
 * @param {number|string} oldValue - Original value
 * @param {number|string} newValue - New value
 * @returns {number|null} Percentage change or null for invalid parameters/division by zero
 *
 * @example
 * calculatePercentageChange(100, 125); // 25 (25% increase)
 * calculatePercentageChange(100, 75); // -25 (25% decrease)
 * calculatePercentageChange(0, 100); // null (division by zero)
 *
 * @complexity Time: O(1), Space: O(1)
 */
const calculatePercentageChange = (oldValue, newValue) => {
  if (!isValidNumber(oldValue) || !isValidNumber(newValue)) {
    cerror('Calculate percentage change', 'Invalid parameters provided');
    return null;
  }

  const oldNum = +oldValue;
  if (oldNum === 0) {
    cerror('Calculate percentage change', 'Original value cannot be 0');
    return null;
  }

  return roundToDecimal(((+newValue - oldNum) / oldNum) * 100);
};

/**
 * Formats number as currency string
 *
 * @description Uses Intl.NumberFormat for locale-aware currency formatting
 * @param {number|string} number - Value to format
 * @param {string} [currency=NUMBER_CONSTANTS.DEFAULT_CURRENCY] - ISO currency code
 * @param {string} [locale=NUMBER_CONSTANTS.DEFAULT_LOCALE] - BCP 47 language tag
 * @returns {string|null} Formatted currency string or null for invalid parameters/formatting errors
 *
 * @example
 * formatNumberToCurrency(1234.5, 'USD', 'en-US'); // "$1,234.50"
 * formatNumberToCurrency(1234.5, 'EUR', 'de-DE'); // "1.234,50 €"
 * formatNumberToCurrency("abc", 'USD', 'en-US'); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const formatNumberToCurrency = (
  number,
  currency = NUMBER_CONSTANTS.DEFAULT_CURRENCY,
  locale = NUMBER_CONSTANTS.DEFAULT_LOCALE
) => {
  if (!isValidNumber(number)) {
    cerror('Format currency', 'Invalid number provided');
    return null;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(+number);
  } catch (error) {
    cerror('Format currency', `Formatting error: ${error.message}`);
    return null;
  }
};

/**
 * Formats number with locale-specific thousands separators
 *
 * @description Uses Intl.NumberFormat for locale-aware number formatting
 * @param {number|string} number - Value to format
 * @param {string} [locale=NUMBER_CONSTANTS.DEFAULT_LOCALE] - BCP 47 language tag
 * @returns {string|null} Formatted number string or null for invalid parameters/formatting errors
 *
 * @example
 * formatNumberWithCommas(1234567.89, 'en-US'); // "1,234,567.89"
 * formatNumberWithCommas(1234567.89, 'de-DE'); // "1.234.567,89"
 * formatNumberWithCommas("abc", 'en-US'); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const formatNumberWithCommas = (number, locale = NUMBER_CONSTANTS.DEFAULT_LOCALE) => {
  if (!isValidNumber(number)) {
    cerror('Format with commas', 'Invalid number provided');
    return null;
  }

  try {
    return new Intl.NumberFormat(locale).format(+number);
  } catch (error) {
    cerror('Format with commas', `Formatting error: ${error.message}`);
    return null;
  }
};

/**
 * Converts number to scientific notation
 *
 * @description Formats number using exponential notation with specified precision
 * @param {number|string} number - Value to convert
 * @param {number} [precision=NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES] - Decimal precision
 * @returns {string|null} Number in scientific notation or null for invalid parameters
 *
 * @example
 * toScientificNotation(123456, 2); // "1.23e+5"
 * toScientificNotation(0.000123, 3); // "1.230e-4"
 * toScientificNotation("abc", 2); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const toScientificNotation = (number, precision = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(number) || !isValidNumber(precision)) {
    cerror('Scientific notation', 'Invalid parameters provided');
    return null;
  }

  return (+number).toExponential(precision);
};

/**
 * Constrains number within min/max bounds
 *
 * @description Ensures number stays within specified range (clamping)
 * @param {number|string} num - Number to clamp
 * @param {number|string} min - Minimum allowed value
 * @param {number|string} max - Maximum allowed value
 * @returns {number|null} Clamped value or null for invalid parameters
 *
 * @example
 * clampNumber(15, 1, 10); // 10
 * clampNumber(-5, 1, 10); // 1
 * clampNumber(5, 1, 10); // 5
 * clampNumber(5, 10, 1); // null (min > max)
 *
 * @complexity Time: O(1), Space: O(1)
 */
const clampNumber = (num, min, max) => {
  if (!isValidNumber(num) || !isValidNumber(min) || !isValidNumber(max)) {
    cerror('Clamp number', 'Invalid parameters provided');
    return null;
  }

  const minVal = +min;
  const maxVal = +max;

  if (minVal > maxVal) {
    cerror('Clamp number', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  return Math.max(minVal, Math.min(maxVal, +num));
};

/**
 * Converts degrees to radians
 *
 * @description Performs unit conversion from degrees to radians
 * @param {number|string} degrees - Angle in degrees
 * @returns {number|null} Angle in radians or null for invalid input
 *
 * @example
 * degreesToRadians(180); // 3.141592653589793 (≈π)
 * degreesToRadians(90); // 1.5707963267948966 (≈π/2)
 * degreesToRadians("abc"); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const degreesToRadians = (degrees) => {
  if (!isValidNumber(degrees)) {
    cerror('Convert to radians', 'Invalid degrees provided');
    return null;
  }

  return +degrees * 0.017453292519943295;
};

/**
 * Converts radians to degrees
 *
 * @description Performs unit conversion from radians to degrees
 * @param {number|string} radians - Angle in radians
 * @returns {number|null} Angle in degrees or null for invalid input
 *
 * @example
 * radiansToDegrees(Math.PI); // 180
 * radiansToDegrees(Math.PI / 2); // 90
 * radiansToDegrees("abc"); // null
 *
 * @complexity Time: O(1), Space: O(1)
 */
const radiansToDegrees = (radians) => {
  if (!isValidNumber(radians)) {
    cerror('Convert to degrees', 'Invalid radians provided');
    return null;
  }

  return +radians * 57.29577951308232;
};

/**
 * Calculates median of valid numbers
 *
 * @description Finds the middle value or average of two middle values in sorted array
 * @param {...*} numbers - Numbers to evaluate (variable arguments)
 * @returns {number|null} Median value or null if no valid numbers
 *
 * @example
 * median(1, 2, 3, 4, 5); // 3
 * median(1, 2, 3, 4); // 2.5 (average of 2 and 3)
 * median("abc", null); // null
 *
 * @complexity Time: O(n log n), Space: O(n)
 */
const median = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  if (validNums.length === 0) {
    cerror('Calculate median', 'No valid numbers provided');
    return null;
  }

  const sorted = _.sortBy(validNums);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/**
 * Calculates population standard deviation of valid numbers
 *
 * @description Measures amount of variation or dispersion from the mean
 * @param {...*} numbers - Numbers to evaluate (variable arguments)
 * @returns {number|null} Standard deviation or null if no valid numbers
 *
 * @example
 * standardDeviation(1, 2, 3, 4, 5); // ≈1.414
 * standardDeviation(10, 10, 10, 10); // 0
 * standardDeviation("abc", null); // null
 *
 * @complexity Time: O(n), Space: O(n)
 */
const standardDeviation = (...numbers) => {
  const validNums = getValidNumbers(numbers);
  if (validNums.length === 0) {
    cerror('Calculate standard deviation', 'No valid numbers provided');
    return null;
  }

  const mean = _.mean(validNums);
  const squaredDifferences = validNums.map((x) => Math.pow(x - mean, 2));
  const variance = _.mean(squaredDifferences);

  return Math.sqrt(variance);
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Conversion
  convertToNumber,

  // Validation
  isValidNumber,
  isInRange,
  isInteger,
  isPositive,
  isEven,
  isOdd,

  // Mathematical operations
  sumNumbers,
  average,
  maxNumber,
  minNumber,
  median,
  standardDeviation,

  // Rounding
  roundToDecimal,
  ceilNumber,
  floorNumber,

  // Random generation
  getRandomNumber,
  getRandomFloat,

  // Percentage calculations
  calculatePercentage,
  calculatePercentageValue,
  calculatePercentageChange,

  // Formatting
  formatNumberToCurrency,
  formatNumberWithCommas,
  toScientificNotation,

  // Utilities
  clampNumber,
  degreesToRadians,
  radiansToDegrees,
};
