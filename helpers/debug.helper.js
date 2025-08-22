// --------------------------- NODE DEPENDENCIES --------------------------- //
const fs = require('fs');
const path = require('path');
const util = require('util');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const Boom = require('@hapi/boom');
const moment = require('moment');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const config = require('../config/env');
const { modes, paths } = require('./constants.helper');

// ----------------- CONSTANTS AND CONFIGURATION ----------------- //
const DEBUG_FILE_PATH = path.resolve(process.cwd(), '.debug');
const DEBUG_TIMEOUT_MINUTES = 10;
const DEFAULT_LINE_LENGTH = 150;
const DEVELOPMENT_MODE_VALUE = 2;

const { isLocal, mode } = config;

/**
 * Reads and parses the debug file content
 * @returns {{isEnabled: boolean, timestamp: string|null, isValid: boolean}}
 * @private
 */
const parseDebugFile = () => {
  try {
    const fileContent = fs.readFileSync(DEBUG_FILE_PATH, 'utf-8').split('\n');
    const debugContent = fileContent[0]?.trim();
    const timestampLine = fileContent[1]?.trim();

    return {
      isEnabled: debugContent === 'true',
      timestamp: timestampLine || null,
      isValid: true,
    };
  } catch (error) {
    console.error(`Error reading debug file: ${error.message}`);
    return {
      isEnabled: false,
      timestamp: null,
      isValid: false,
    };
  }
};

/**
 * Validates if a timestamp string is valid and not expired
 * @param {string} timestampStr - Timestamp string in 'YYYY-MM-DD HH:mm:ss' format
 * @returns {boolean} True if timestamp is valid and not expired
 * @private
 */
const isTimestampValid = (timestampStr) => {
  if (!timestampStr) return false;

  const timestamp = moment(timestampStr, 'YYYY-MM-DD HH:mm:ss').valueOf();

  if (isNaN(timestamp)) {
    console.warn(`Invalid timestamp format in debug file: ${timestampStr}`);
    return false;
  }

  const now = moment().valueOf();
  return now <= timestamp;
};

/**
 * Writes debug configuration to file
 * @param {boolean} enable - Whether to enable debug mode
 * @param {moment.Moment} [expirationTime] - When debug mode should expire
 * @private
 */
const writeDebugFile = (enable, expirationTime = null) => {
  try {
    const debugContent = enable ? 'true' : 'false';
    const timestamp = expirationTime ? expirationTime.format('YYYY-MM-DD HH:mm:ss') : '';
    const content = `${debugContent}\n${timestamp}`;

    fs.writeFileSync(DEBUG_FILE_PATH, content, 'utf-8');
    console.log(`Debug mode set to: ${debugContent}`);
  } catch (error) {
    console.error(`Error writing to debug file: ${error.message}`);
    throw error;
  }
};

/**
 * Ensures the logs directory exists
 * @private
 */
const ensureLogsDirectory = () => {
  if (!fs.existsSync(paths.logs)) {
    fs.mkdirSync(paths.logs, { recursive: true });
  }
};

// ----------------- CORE DEBUG FUNCTIONS ----------------- //

/**
 * Checks if debug mode is currently enabled and hasn't expired.
 * Debug mode automatically expires after a specified timeout period.
 *
 * @param {boolean} [allowDevMode=false] - If true, enables debug mode for development environments
 * @returns {boolean} True if debug mode is enabled and valid, false otherwise
 */
const isDebugMode = (allowDevMode = false) => {
  // Always enable debug mode in local environment
  if (isLocal) return true;

  // Check development mode if allowed
  if (allowDevMode && modes[mode] === DEVELOPMENT_MODE_VALUE) {
    return true;
  }

  const debugFile = parseDebugFile();

  if (!debugFile.isValid || !debugFile.isEnabled) {
    return false;
  }

  // If no timestamp, debug mode is invalid
  if (!debugFile.timestamp) {
    console.warn('Debug file missing timestamp on second line.');
    return false;
  }

  // Check if timestamp is still valid
  if (!isTimestampValid(debugFile.timestamp)) {
    // Reset debug mode if expired
    writeDebugFile(false);
    return false;
  }

  return true;
};

/**
 * Checks if the current environment is local or development.
 *
 * @param {boolean} [allowDevMode=false] - If true, allows development environments to be considered local
 * @returns {boolean} True if the current environment is local or development, false otherwise
 */
const isDevelopmentMode = (allowDevMode = false) => {
  if (isLocal) return true;

  return allowDevMode && modes[mode] === DEVELOPMENT_MODE_VALUE;
};

/**
 * Enables or disables debug mode with automatic expiration.
 * When enabled, debug mode will automatically disable after the specified timeout.
 *
 * @param {boolean} [enable=true] - Whether to enable or disable debug mode
 * @param {number} [timeoutMinutes=10] - Minutes until debug mode expires (only when enabling)
 * @returns {string} A message indicating the debug mode status
 */
const setDebugMode = (enable = true, timeoutMinutes = DEBUG_TIMEOUT_MINUTES) => {
  const now = moment();
  let expirationTime = null;
  let response = 'Debug mode ';

  if (enable) {
    expirationTime = now.clone().add(timeoutMinutes, 'minutes');
    response += `enabled until ${expirationTime.format('HH:mm:ss')}`;
  } else {
    response += 'disabled';
  }

  try {
    writeDebugFile(enable, expirationTime);
    return `${response}.`;
  } catch (error) {
    return `Failed to set debug mode: ${error.message}`;
  }
};

// ----------------- FORMATTING UTILITIES ----------------- //

/**
 * Creates a formatted header with balanced dashes around a title
 *
 * @param {string} title - The title to display
 * @param {number} [lineLength=150] - Total length of the line
 * @returns {string} Formatted header string
 */
const createHeader = (title, lineLength = DEFAULT_LINE_LENGTH) => {
  const titleLength = title.length;
  const paddingLength = Math.max(0, lineLength - titleLength - 2);
  const padding = '-'.repeat(Math.floor(paddingLength / 2));
  return `\n${padding} ${title.toUpperCase()} ${padding}\n`;
};

/**
 * Creates a separator line of dashes
 *
 * @param {number} [lineLength=150] - Length of the line
 * @returns {string} Line of dashes
 */
const createSeparator = (lineLength = DEFAULT_LINE_LENGTH) => {
  return `\n${'-'.repeat(lineLength)}\n`;
};

// ----------------- LOGGING FUNCTIONS ----------------- //

/**
 * Returns a logging function that outputs formatted messages to the console.
 * Only works when debug mode is enabled.
 *
 * @param {string} header - The header to display at the top of the log block
 * @param {any} [additionalData] - Additional data to display in a separate section
 * @returns {Function|false} A logging function or false if debug mode is disabled
 */
const wrapLogging = (header, additionalData) => {
  if (!isDebugMode()) return false;

  const lineLength = DEFAULT_LINE_LENGTH;

  console.log(createHeader(header, lineLength));

  // Display additional data if provided
  if (additionalData !== undefined) {
    console.dir(additionalData, { depth: null });
    console.log(createSeparator(lineLength));
  }

  return (message) => {
    console.log(message);
    if (typeof message === 'string' && message.startsWith('Executing')) {
      console.log(createSeparator(lineLength));
    }
  };
};

/**
 * Custom logging function that outputs messages with a formatted title.
 * Only works when debug mode is enabled.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log
 */
const clog = (title, ...args) => {
  if (!isDebugMode()) return;

  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Log each argument individually
  if (args.length === 1) {
    console.log(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.log(arg));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Custom error logging function that outputs error messages with a formatted title.
 * Only works when debug mode is enabled.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log as errors
 */
const cerror = (title, ...args) => {
  if (!isDebugMode()) return;

  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Log each error argument individually
  if (args.length === 1) {
    console.error(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.error(arg));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Custom directory inspection logging function that outputs detailed object information.
 * Only works when debug mode is enabled.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to inspect with full depth
 */
const cdir = (title, ...args) => {
  if (!isDebugMode()) return;

  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Inspect each argument individually with full depth
  if (args.length === 1) {
    console.dir(args[0], { depth: null });
  } else if (args.length > 1) {
    args.forEach((arg) => console.dir(arg, { depth: null }));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Clears the console and logs messages with a formatted title.
 * Only works when debug mode is enabled.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log
 */
const clear = (title, ...args) => {
  if (!isDebugMode()) return;

  const lineLength = DEFAULT_LINE_LENGTH;
  console.clear();
  console.log(createHeader(title, lineLength));

  // Log each argument individually
  if (args.length === 1) {
    console.log(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.log(arg));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Clears the console and performs detailed object inspection logging.
 * Only works when debug mode is enabled.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to inspect with full depth
 */
const clir = (title, ...args) => {
  if (!isDebugMode()) return;

  const lineLength = DEFAULT_LINE_LENGTH;
  console.clear();
  console.log(createHeader(title, lineLength));

  // Inspect each argument individually with full depth
  if (args.length === 1) {
    console.dir(args[0], { depth: null });
  } else if (args.length > 1) {
    args.forEach((arg) => console.dir(arg, { depth: null }));
  }

  console.log(createSeparator(lineLength));
};

// ----------------- ERROR HANDLING ----------------- //

/**
 * Registers an error in the error log file with detailed information.
 * Creates a comprehensive error log entry with timestamp, location, and additional data.
 *
 * @param {string} location - Where the error occurred (e.g., 'UserController.createUser')
 * @param {Error} error - The error object to log
 * @param {string|number} statusCode - HTTP status code or error code
 * @param {any} [additionalData=null] - Additional context data related to the error
 * @returns {Boom} Custom Boom error object for HTTP responses
 * @throws {Error} If unable to write to log file
 */
const registerError = (location, error, statusCode, additionalData = null) => {
  const lineLength = DEFAULT_LINE_LENGTH;
  let logOutput = '';

  // Build error title
  const title = `[${location}] - Error ${statusCode}`;
  logOutput += `${createHeader(title, lineLength)}\n`;

  // Log error details
  const errorDetails = util.inspect(error, { depth: null, colors: false });
  logOutput += `${errorDetails}\n`;

  // Add timestamp
  const timestamp = moment().format('dddd, DD [of] MMMM [of] YYYY [at] HH:mm:ss.SSS');
  logOutput += createHeader(timestamp, lineLength);

  // Handle additional data if provided
  if (additionalData !== null && additionalData !== undefined) {
    logOutput += createSeparator(lineLength);
    logOutput += '\n';

    if (typeof additionalData === 'object') {
      try {
        // Safely serialize the data
        const serializedData = JSON.stringify(additionalData, null, 2);
        console.dir(additionalData, { depth: null });
        logOutput += `${serializedData}\n`;
      } catch (serializationError) {
        const fallbackMessage = `Unable to serialize additional data: ${serializationError.message}`;
        console.error(fallbackMessage);
        logOutput += `${fallbackMessage}\n`;
      }
    } else {
      const dataString = String(additionalData);
      console.log(dataString);
      logOutput += `${dataString}\n`;
    }
  }

  // Generate log file path with current date
  const currentDate = moment().format('dddd, DD [of] MMMM [of] YYYY');
  const errorLogPath = path.join(paths.logs, `${currentDate}.error.log`);

  try {
    // Ensure logs directory exists
    ensureLogsDirectory();

    // Append to log file
    fs.appendFileSync(errorLogPath, logOutput);
  } catch (fileError) {
    console.error(`Failed to write error log: ${fileError.message}`);
    throw fileError;
  }

  // Return Boom error object for HTTP responses
  return new Boom.Boom(error.message || error, { statusCode });
};

/**
 * Custom logging function that ALWAYS outputs messages with a formatted title.
 * Works independently of debug mode status.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log
 */
const plog = (title, ...args) => {
  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Log each argument individually
  if (args.length === 1) {
    console.log(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.log(arg));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Custom directory inspection logging function that ALWAYS outputs detailed object information.
 * Works independently of debug mode status.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to inspect with full depth
 */
const pdir = (title, ...args) => {
  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Inspect each argument individually with full depth
  if (args.length === 1) {
    console.dir(args[0], { depth: null });
  } else if (args.length > 1) {
    args.forEach((arg) => console.dir(arg, { depth: null }));
  }

  console.log(createSeparator(lineLength));
};

/**
 * Custom error logging function that ALWAYS outputs error messages with a formatted title.
 * Works independently of debug mode status.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log as errors
 */
const perror = (title, ...args) => {
  const lineLength = DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Log each error argument individually
  if (args.length === 1) {
    console.error(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.error(arg));
  }

  console.log(createSeparator(lineLength));
};

// ----------------- MODULE EXPORTS ----------------- //
module.exports = {
  // Core debug functions
  isDebugMode,
  isDevelopmentMode,
  setDebugMode,

  // Debug logging functions (conditional)
  wrapLogging,
  clog,
  cdir,
  cerror,
  clear,
  clir,

  // Permanent logging functions (always active)
  plog,
  pdir,
  perror,

  // Error handling
  registerError,

  // Utility functions
  createHeader,
  createSeparator,
};
