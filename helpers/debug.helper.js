// =============================================================================
// DEBUG & LOGGING UTILITIES - Enhanced Development Tools
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides configurable debug mode with automatic expiration
// - Offers formatted console logging with header/section support
// - Handles error registration with file logging capabilities
// - Includes device detection utilities for request classification
// - Supports both conditional (debug-mode only) and permanent logging
//
// ARCHITECTURAL DECISIONS:
// - File-based debug configuration for persistence across restarts
// - Moment.js for robust timestamp handling and time calculations
// - Boom for standardized HTTP error response formatting
// - Separation of concerns between debug utilities and error handling
// - Configurable timeouts and line lengths for flexibility
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Environment variables: Considered but rejected for requiring restart on changes
// - Database storage: Overkill for temporary debug state management
// - Memory-only storage: Would lose state on server restarts
// - Third-party logging services: Added complexity for simple debug needs
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for most operations, O(n) for file I/O operations
// - Space complexity: O(1) for memory usage, O(n) for log file growth
// - File I/O operations are synchronous but minimal and infrequent
// - Debug checks have minimal performance impact in production
//
// SECURITY CONSIDERATIONS:
// - Debug mode exposes internal data - should never be enabled in production
// - File operations validated with try/catch to prevent crashes
// - Error logs may contain sensitive data - ensure proper file permissions
// - Input validation performed on timestamp parsing
//
// USAGE EXAMPLES:
// - Basic debug logging: clog('Section Title', data);
// - Error handling: const error = registerError('Not found', 404);
// - Device detection: const device = detectDeviceType(req);
// - Temporary debug enablement: setDebugMode(true, 15);
//
// MAINTENANCE & TROUBLESHOOTING:
// - Debug file location: .debug in project root
// - Error logs location: /logs directory with date-based filenames
// - Common issues: File permission errors, disk space exhaustion
// - Monitor log file growth in long-running processes
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 12+ for filesystem operations and modern JS features
// - Compatible with Express.js and other web frameworks
// - Third-party dependencies: @hapi/boom, moment
// - Browser compatibility: None (server-side only)
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations
const path = require('path'); // Path manipulation utilities

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const Boom = require('@hapi/boom'); // HTTP error handling utilities
const moment = require('moment'); // Date/time manipulation and formatting

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { MODES, PATHS, DEBUG_SETTINGS } = require('./constants.helper'); // Constants and paths
const { isLocal, mode } = require('../config/env'); // Application configuration

/**
 * Reads and parses the debug file content
 * @returns {{isEnabled: boolean, timestamp: string|null, isValid: boolean}}
 * @private
 */
const parseDebugFile = () => {
  try {
    const fileContent = fs.readFileSync(PATHS.DEBUG, 'utf-8').split('\n');
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

    fs.writeFileSync(PATHS.DEBUG, content, 'utf-8');
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
  if (!fs.existsSync(PATHS.logs)) {
    fs.mkdirSync(PATHS.LOGS, { recursive: true });
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
  if (allowDevMode && MODES[mode] === DEBUG_SETTINGS.DEVELOPMENT_MODE_VALUE) {
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

  return allowDevMode && MODES[mode.toUpperCase()] === DEBUG_SETTINGS.DEVELOPMENT_MODE_VALUE;
};

/**
 * Enables or disables debug mode with automatic expiration.
 * When enabled, debug mode will automatically disable after the specified timeout.
 *
 * @param {boolean} [enable=true] - Whether to enable or disable debug mode
 * @param {number} [timeoutMinutes=10] - Minutes until debug mode expires (only when enabling)
 * @returns {string} A message indicating the debug mode status
 */
const setDebugMode = (enable = true, timeoutMinutes = DEBUG_SETTINGS.DEBUG_TIMEOUT_MINUTES) => {
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
const createHeader = (title, lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH) => {
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
const createSeparator = (lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH) => {
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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;

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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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

  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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
 * Registers an error in the system, writing it to a log file and returning a Boom error object.
 * The error is written to a log file with the current date in the filename.
 * The log entry includes the error message, HTTP status code, and a timestamp.
 * Additional information can be provided as an object, which will be safely serialized
 * and logged. If the additional information cannot be serialized, a fallback message is logged.
 * @param {string} error - The error message to log
 * @param {number} httpCode - The HTTP status code associated with the error
 * @param {Object} [options] - Additional options
 * @param {string} [options.location] - The location of the error
 * @param {number} [options.code] - A code associated with the error
 * @param {Object|string|number} [options.additionalInfo] - Additional information to log
 * @returns {Boom} - A Boom error object for use in HTTP responses
 */
const registerError = (error, httpCode, { location, code, additionalInfo } = {}) => {
  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
  let logOutput = '';

  // Build error title
  const locationText = location ? `[${location}]` : '[Unknown Location]';
  const codeText = code ? ` - Code ${code}` : '';
  const title = `${locationText} - HTTP ${httpCode}${codeText}`;
  logOutput += `${createHeader(title, lineLength)}\n`;

  // Log error details
  logOutput += `Error: ${error}\n`;

  // Add timestamp
  const timestamp = moment().format('dddd, DD [of] MMMM [of] YYYY [at] HH:mm:ss.SSS');
  logOutput += createHeader(timestamp, lineLength);

  // Handle additional info if provided
  if (additionalInfo !== null && additionalInfo !== undefined) {
    logOutput += createSeparator(lineLength);
    logOutput += '\n';

    if (typeof additionalInfo === 'object') {
      try {
        const serializedData = JSON.stringify(additionalInfo, null, 2);
        console.dir(additionalInfo, { depth: null });
        logOutput += `${serializedData}\n`;
      } catch (serializationError) {
        const fallbackMessage = `Unable to serialize additional info: ${serializationError.message}`;
        console.error(fallbackMessage);
        logOutput += `${fallbackMessage}\n`;
      }
    } else {
      const dataString = String(additionalInfo);
      console.log(dataString);
      logOutput += `${dataString}\n`;
    }
  }

  // Generate log file path with current date
  const currentDate = moment().format('dddd, DD [of] MMMM [of] YYYY');
  const errorLogPath = path.join(PATHS.LOGS, `${currentDate}.error.log`);

  try {
    ensureLogsDirectory();
    fs.appendFileSync(errorLogPath, logOutput);
  } catch (fileError) {
    console.error(`Failed to write error log: ${fileError.message}`);
    throw fileError;
  }

  let boomError;

  switch (httpCode) {
    case 400:
      boomError = Boom.badRequest(error);
      break;
    case 401:
      boomError = Boom.unauthorized(error);
      break;
    case 403:
      boomError = Boom.forbidden(error);
      break;
    case 404:
      boomError = Boom.notFound(error);
      break;
    case 409:
      boomError = Boom.conflict(error);
      break;
    case 422:
      boomError = Boom.badData(error);
      break;
    case 429:
      boomError = Boom.tooManyRequests(error);
      break;
    default:
      boomError = Boom.internal(error);
  }

  return boomError;
};

/**
 * Custom logging function that ALWAYS outputs messages with a formatted title.
 * Works independently of debug mode status.
 *
 * @param {string} title - Title for the log section
 * @param {...any} args - Arguments to log
 */
const plog = (title, ...args) => {
  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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
  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
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
  const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
  console.log(createHeader(title, lineLength));

  // Log each error argument individually
  if (args.length === 1) {
    console.error(args[0]);
  } else if (args.length > 1) {
    args.forEach((arg) => console.error(arg));
  }

  console.log(createSeparator(lineLength));
};

// =============================================================================
// DEVICE DETECTION UTILITIES
// =============================================================================

/**
 * Detects the type of device making the request based on User-Agent headers
 * and other request characteristics. This helps implement device-specific
 * behavior for cookies, authentication, and UI rendering.
 *
 * @param {Object} req - Express request object
 * @returns {string} Device type identifier (web_browser, mobile_app, etc.)
 */
const detectDeviceType = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const isApp = req.headers['x-requested-with'] === 'com.company.app';
  const isApiClient = req.headers['x-api-client'] !== undefined;

  // Convert to lowercase for easier matching
  const ua = userAgent.toLowerCase();

  // Mobile App Detection (via custom headers or user agent)
  if (isApp || ua.includes('company-app') || ua.includes('reactnative')) {
    return 'mobile_app';
  }

  // Smart TV Detection
  if (
    ua.includes('smart-tv') ||
    ua.includes('tv') ||
    ua.includes('roku') ||
    ua.includes('appletv') ||
    ua.includes('crkey') ||
    ua.includes('aftex')
  ) {
    return 'smart_tv';
  }

  // IoT Device Detection
  if (ua.includes('iot') || ua.includes('embedded') || ua.includes('m2m') || ua.includes('device')) {
    return 'iot_device';
  }

  // Desktop Application Detection
  if (isApiClient || ua.includes('electron') || ua.includes('postman') || ua.includes('insomnia')) {
    return 'desktop_app';
  }

  // Game Console Detection
  if (ua.includes('playstation') || ua.includes('xbox') || ua.includes('nintendo') || ua.includes('wii')) {
    return 'game_console';
  }

  // Mobile Browser Detection
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('ipod') ||
    ua.includes('windows phone')
  ) {
    return 'mobile_browser';
  }

  // Default to web browser for all other cases
  return 'web_browser';
};

/**
 * Enhanced device detection with additional metadata
 * @param {Object} req - Express request object
 * @returns {Object} Device information with type and additional metadata
 */
const detectDeviceWithMetadata = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const deviceType = detectDeviceType(req);

  return {
    type: deviceType,
    userAgent: userAgent,
    isMobile: deviceType.includes('mobile'),
    isNativeApp: deviceType.includes('app') && !deviceType.includes('browser'),
    isWeb: deviceType.includes('browser'),
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
  };
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Core debug functions
  isDebugMode,
  isDevelopmentMode,
  setDebugMode,

  // Conditional logging (debug mode only)
  wrapLogging,
  clog,
  cdir,
  cerror,
  clear,
  clir,

  // Permanent logging (always active)
  plog,
  pdir,
  perror,

  // Error handling
  registerError,

  // Formatting utilities
  createHeader,
  createSeparator,

  // Device detection
  detectDeviceType,
  detectDeviceWithMetadata,
};
