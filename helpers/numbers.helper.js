// =============================================================================
// NUMBER HELPER - Utilities for number handling and manipulation
// =============================================================================
// Module providing utility functions for mathematical operations,
// validation, formatting, and number conversion.
//
// =============================================================================

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const { NUMBER_CONSTANTS } = require('./constants.helper');
const { cerror } = require('./debug.helper');

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a given value can be converted to a valid finite number.
 *
 * @param {any} input - The value to check
 * @returns {boolean} true if input can be converted to valid number, false otherwise
 *
 * @example
 * isValidNumber(42)        // true
 * isValidNumber("42")      // true
 * isValidNumber("abc")     // false
 * isValidNumber(Infinity)  // false
 */
const isValidNumber = (input) => {
  return !isNaN(input) && isFinite(Number(input));
};

/**
 * Checks if a number is within a specific range.
 *
 * @param {number} num - The number to check
 * @param {number} min - Minimum range value (inclusive)
 * @param {number} max - Maximum range value (inclusive)
 * @returns {boolean} true if number is in range, false otherwise
 *
 * @example
 * isInRange(5, 1, 10)     // true
 * isInRange(15, 1, 10)    // false
 */
const isInRange = (num, min, max) => {
  if (!isValidNumber(num) || !isValidNumber(min) || !isValidNumber(max)) {
    return false;
  }
  return Number(num) >= min && Number(num) <= max;
};

/**
 * Checks if a number is integer.
 *
 * @param {any} input - The value to check
 * @returns {boolean} true if it's an integer number, false otherwise
 *
 * @example
 * isInteger(42)      // true
 * isInteger(42.5)    // false
 * isInteger("42")    // true
 */
const isInteger = (input) => {
  return isValidNumber(input) && Number.isInteger(Number(input));
};

/**
 * Checks if a number is positive.
 *
 * @param {any} input - The value to check
 * @returns {boolean} true if it's a positive number, false otherwise
 *
 * @example
 * isPositive(42)     // true
 * isPositive(-42)    // false
 * isPositive(0)      // false
 */
const isPositive = (input) => {
  return isValidNumber(input) && Number(input) > 0;
};

/**
 * Checks if a number is even.
 *
 * @param {any} input - The value to check
 * @returns {boolean} true if it's an even number, false otherwise
 *
 * @example
 * isEven(4)    // true
 * isEven(5)    // false
 */
const isEven = (input) => {
  return isInteger(input) && Number(input) % 2 === 0;
};

/**
 * Checks if a number is odd.
 *
 * @param {any} input - The value to check
 * @returns {boolean} true if it's an odd number, false otherwise
 *
 * @example
 * isOdd(5)    // true
 * isOdd(4)    // false
 */
const isOdd = (input) => {
  return isInteger(input) && Number(input) % 2 !== 0;
};

// =============================================================================
// BASIC MATH OPERATIONS
// =============================================================================

/**
 * Sums an array of numbers with robust validation.
 *
 * @param {...number} numbers - Numbers to sum
 * @returns {number} Total sum of valid numbers
 *
 * @example
 * sumNumbers(1, 2, 3, 4)           // 10
 * sumNumbers(1, "2", 3)            // 6
 * sumNumbers(1, "abc", 3)          // 4 (ignores invalid values)
 */
const sumNumbers = (...numbers) => {
  return numbers.filter(isValidNumber).reduce((total, number) => total + Number(number), 0);
};

/**
 * Calculates the average of an array of numbers.
 *
 * @param {...number} numbers - Numbers to calculate average
 * @returns {number} Average of valid numbers
 *
 * @example
 * average(1, 2, 3, 4, 5)    // 3
 * average(10, 20, 30)       // 20
 */
const average = (...numbers) => {
  const validNumbers = numbers.filter(isValidNumber);

  if (validNumbers.length === 0) {
    cerror('Calculate average', 'No valid numbers provided');
    return 0;
  }

  return sumNumbers(...validNumbers) / validNumbers.length;
};

/**
 * Finds maximum value in an array of numbers.
 *
 * @param {...number} numbers - Numbers to compare
 * @returns {number|null} Maximum value or null if no valid numbers
 *
 * @example
 * maxNumber(1, 5, 3, 9, 2)    // 9
 * maxNumber(-1, -5, -3)       // -1
 */
const maxNumber = (...numbers) => {
  const validNumbers = numbers.filter(isValidNumber).map(Number);

  if (validNumbers.length === 0) {
    cerror('Find maximum', 'No valid numbers provided');
    return null;
  }

  return Math.max(...validNumbers);
};

/**
 * Finds minimum value in an array of numbers.
 *
 * @param {...number} numbers - Numbers to compare
 * @returns {number|null} Minimum value or null if no valid numbers
 *
 * @example
 * minNumber(1, 5, 3, 9, 2)    // 1
 * minNumber(-1, -5, -3)       // -5
 */
const minNumber = (...numbers) => {
  const validNumbers = numbers.filter(isValidNumber).map(Number);

  if (validNumbers.length === 0) {
    cerror('Find minimum', 'No valid numbers provided');
    return null;
  }

  return Math.min(...validNumbers);
};

// =============================================================================
// ROUNDING AND PRECISION FUNCTIONS
// =============================================================================

/**
 * Rounds a number to specific decimal places.
 *
 * @param {number} num - Number to round
 * @param {number} [decimals=2] - Number of decimal places (default 2)
 * @returns {number|null} Rounded number or null if invalid input
 *
 * @example
 * roundToDecimal(3.14159, 2)    // 3.14
 * roundToDecimal(3.14159, 4)    // 3.1416
 * roundToDecimal(3.14159)       // 3.14
 */
const roundToDecimal = (num, decimals = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(num) || !isValidNumber(decimals)) {
    cerror('Round decimal', 'Invalid parameters provided');
    return null;
  }

  const factor = Math.pow(10, decimals);
  return Math.round(Number(num) * factor) / factor;
};

/**
 * Rounds a number up.
 *
 * @param {number} num - Number to round up
 * @returns {number|null} Number rounded up or null if invalid
 *
 * @example
 * ceilNumber(3.1)     // 4
 * ceilNumber(3.9)     // 4
 * ceilNumber(-3.1)    // -3
 */
const ceilNumber = (num) => {
  if (!isValidNumber(num)) {
    cerror('Round up', 'Invalid number provided');
    return null;
  }

  return Math.ceil(Number(num));
};

/**
 * Rounds a number down.
 *
 * @param {number} num - Number to round down
 * @returns {number|null} Number rounded down or null if invalid
 *
 * @example
 * floorNumber(3.1)     // 3
 * floorNumber(3.9)     // 3
 * floorNumber(-3.1)    // -4
 */
const floorNumber = (num) => {
  if (!isValidNumber(num)) {
    cerror('Round down', 'Invalid number provided');
    return null;
  }

  return Math.floor(Number(num));
};

// =============================================================================
// RANDOM NUMBER GENERATION
// =============================================================================

/**
 * Generates random integer between min and max values (inclusive).
 *
 * @param {number} min - Minimum range value
 * @param {number} max - Maximum range value
 * @returns {number|null} Randomly generated number or null if invalid parameters
 *
 * @example
 * getRandomNumber(1, 10)      // Example: 7
 * getRandomNumber(0, 100)     // Example: 42
 */
const getRandomNumber = (min, max) => {
  if (!isValidNumber(min) || !isValidNumber(max)) {
    cerror('Generate random number', 'Invalid min/max parameters');
    return null;
  }

  const minNum = Number(min);
  const maxNum = Number(max);

  if (minNum > maxNum) {
    cerror('Generate random number', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
};

/**
 * Generates random decimal number between min and max values.
 *
 * @param {number} min - Minimum range value
 * @param {number} max - Maximum range value
 * @param {number} [decimals=2] - Number of decimal places in result
 * @returns {number|null} Random decimal number or null if invalid parameters
 *
 * @example
 * getRandomFloat(1.0, 2.0, 2)    // Example: 1.47
 * getRandomFloat(0, 1)           // Example: 0.73
 */
const getRandomFloat = (min, max, decimals = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(min) || !isValidNumber(max) || !isValidNumber(decimals)) {
    cerror('Generate random decimal', 'Invalid parameters');
    return null;
  }

  const minNum = Number(min);
  const maxNum = Number(max);

  if (minNum > maxNum) {
    cerror('Generate random decimal', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  const random = Math.random() * (maxNum - minNum) + minNum;
  return roundToDecimal(random, decimals);
};

// =============================================================================
// PERCENTAGE CALCULATIONS
// =============================================================================

/**
 * Calculates what percentage a number represents of another.
 *
 * @param {number} part - Number representing the part
 * @param {number} total - Total number
 * @returns {number|null} Calculated percentage or null on error
 *
 * @example
 * calculatePercentage(25, 100)    // 25.00
 * calculatePercentage(15, 75)     // 20.00
 * calculatePercentage(1, 3)       // 33.33
 */
const calculatePercentage = (part, total) => {
  if (!isValidNumber(part) || !isValidNumber(total)) {
    cerror('Calculate percentage', 'Invalid parameters provided');
    return null;
  }

  const totalNum = Number(total);

  if (totalNum === 0) {
    cerror('Calculate percentage', 'Division by zero: total cannot be 0');
    return null;
  }

  const percentage = (Number(part) / totalNum) * 100;
  return roundToDecimal(percentage);
};

/**
 * Calculates the value representing a specific percentage of a number.
 *
 * @param {number} percentage - Percentage to calculate
 * @param {number} total - Total number
 * @returns {number|null} Calculated value or null on error
 *
 * @example
 * calculatePercentageValue(25, 100)    // 25
 * calculatePercentageValue(15, 200)    // 30
 * calculatePercentageValue(50, 80)     // 40
 */
const calculatePercentageValue = (percentage, total) => {
  if (!isValidNumber(percentage) || !isValidNumber(total)) {
    cerror('Calculate percentage value', 'Invalid parameters provided');
    return null;
  }

  const result = (Number(percentage) / 100) * Number(total);
  return roundToDecimal(result);
};

/**
 * Calculates percentage change between two values.
 *
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @returns {number|null} Percentage change or null on error
 *
 * @example
 * calculatePercentageChange(100, 150)    // 50.00 (50% increase)
 * calculatePercentageChange(200, 150)    // -25.00 (25% decrease)
 */
const calculatePercentageChange = (oldValue, newValue) => {
  if (!isValidNumber(oldValue) || !isValidNumber(newValue)) {
    cerror('Calculate percentage change', 'Invalid parameters provided');
    return null;
  }

  const oldNum = Number(oldValue);

  if (oldNum === 0) {
    cerror('Calculate percentage change', 'Original value cannot be 0');
    return null;
  }

  const change = ((Number(newValue) - oldNum) / oldNum) * 100;
  return roundToDecimal(change);
};

// =============================================================================
// FORMATTING AND CONVERSION
// =============================================================================

/**
 * Formats number as currency using specific locale configuration.
 *
 * @param {number} number - Number to format
 * @param {string} [currency='USD'] - Currency code (ISO 4217)
 * @param {string} [locale='en-US'] - Locale setting
 * @returns {string|null} Formatted currency string or null on error
 *
 * @example
 * formatNumberToCurrency(1234.56, 'USD', 'en-US')    // "$1,234.56"
 * formatNumberToCurrency(1234.56, 'EUR', 'de-DE')    // "1.234,56 €"
 * formatNumberToCurrency(1234.56, 'COP', 'es-CO')    // "$1.235" (rounded)
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
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    });

    return formatter.format(Number(number));
  } catch (error) {
    cerror('Format currency', `Formatting error: ${error.message}`);
    return null;
  }
};

/**
 * Formats number with thousands separators.
 *
 * @param {number} number - Number to format
 * @param {string} [locale='en-US'] - Locale setting
 * @returns {string|null} Formatted number or null on error
 *
 * @example
 * formatNumberWithCommas(1234567)              // "1,234,567"
 * formatNumberWithCommas(1234567.89, 'de-DE') // "1.234.567,89"
 */
const formatNumberWithCommas = (number, locale = NUMBER_CONSTANTS.DEFAULT_LOCALE) => {
  if (!isValidNumber(number)) {
    cerror('Format with commas', 'Invalid number provided');
    return null;
  }

  try {
    return new Intl.NumberFormat(locale).format(Number(number));
  } catch (error) {
    cerror('Format with commas', `Formatting error: ${error.message}`);
    return null;
  }
};

/**
 * Converts number to scientific notation.
 *
 * @param {number} number - Number to convert
 * @param {number} [precision=2] - Number of precision digits
 * @returns {string|null} Scientific notation or null on error
 *
 * @example
 * toScientificNotation(1234567)      // "1.23e+6"
 * toScientificNotation(0.00012, 3)   // "1.200e-4"
 */
const toScientificNotation = (number, precision = NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES) => {
  if (!isValidNumber(number) || !isValidNumber(precision)) {
    cerror('Scientific notation', 'Invalid parameters provided');
    return null;
  }

  return Number(number).toExponential(precision);
};

// =============================================================================
// ADDITIONAL UTILITIES
// =============================================================================

/**
 * Restricts number within specific range.
 *
 * @param {number} num - Number to restrict
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number|null} Restricted number or null on error
 *
 * @example
 * clampNumber(15, 0, 10)    // 10
 * clampNumber(-5, 0, 10)    // 0
 * clampNumber(5, 0, 10)     // 5
 */
const clampNumber = (num, min, max) => {
  if (!isValidNumber(num) || !isValidNumber(min) || !isValidNumber(max)) {
    cerror('Clamp number', 'Invalid parameters provided');
    return null;
  }

  const numValue = Number(num);
  const minValue = Number(min);
  const maxValue = Number(max);

  if (minValue > maxValue) {
    cerror('Clamp number', 'Minimum value must be less than or equal to maximum');
    return null;
  }

  return Math.max(minValue, Math.min(maxValue, numValue));
};

/**
 * Converts degrees to radians.
 *
 * @param {number} degrees - Degrees to convert
 * @returns {number|null} Radians or null on error
 *
 * @example
 * degreesToRadians(180)    // 3.14159...
 * degreesToRadians(90)     // 1.5708...
 */
const degreesToRadians = (degrees) => {
  if (!isValidNumber(degrees)) {
    cerror('Convert to radians', 'Invalid degrees provided');
    return null;
  }

  return (Number(degrees) * Math.PI) / 180;
};

/**
 * Converts radians to degrees.
 *
 * @param {number} radians - Radians to convert
 * @returns {number|null} Degrees or null on error
 *
 * @example
 * radiansToDegrees(Math.PI)      // 180
 * radiansToDegrees(Math.PI / 2)  // 90
 */
const radiansToDegrees = (radians) => {
  if (!isValidNumber(radians)) {
    cerror('Convert to degrees', 'Invalid radians provided');
    return null;
  }

  return (Number(radians) * 180) / Math.PI;
};

// =============================================================================
// MODULE EXPORT
// =============================================================================

module.exports = {
  // Validation
  isValidNumber,
  isInRange,
  isInteger,
  isPositive,
  isEven,
  isOdd,

  // Basic math operations
  sumNumbers,
  average,
  maxNumber,
  minNumber,

  // Rounding and precision
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

  // Formatting and conversion
  formatNumberToCurrency,
  formatNumberWithCommas,
  toScientificNotation,

  // Additional utilities
  clampNumber,
  degreesToRadians,
  radiansToDegrees,
};
