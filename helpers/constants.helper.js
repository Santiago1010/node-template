// =============================================================================
// CONSTANTS HELPER - Application-wide constants and paths
// =============================================================================
// Centralizes and exports commonly used constants and paths throughout the application.
//
// Designed to be extensible - new constants can be added as needed while maintaining
// the same export structure. All paths are derived from the application root directory.
//
// Usage: Destructure required constants from the imported object.
// Example: const { PATHS, MODES } = require('~/helpers/constants.helper.js');
// =============================================================================

/**
 * Environment modes with their corresponding numeric values
 * @constant {Object}
 * @property {number} PRODUCTION - Production environment mode
 * @property {number} DEVELOPMENT - Development environment mode
 * @property {number} TEST - Test environment mode
 * @property {number} LOCAL - Local environment mode
 */
const MODES = {
  PRODUCTION: 4,
  DEVELOPMENT: 2,
  TEST: 1,
  LOCAL: 0,
};

/**
 * Root directory of the application
 * @constant {string}
 */
const ROOT = process.cwd();

/**
 * Paths for different application components relative to the root directory
 * @constant {Object}
 * @property {string} TEMPLATES - Path for template files
 * @property {string} CONTROLLERS - Path for controller files
 * @property {string} DIAGRAMS - Path for context diagrams
 * @property {string} SERVICES - Path for service files
 * @property {string} LOCALES - Path for localization files
 * @property {string} ROUTES - Path for route definitions
 * @property {string} MODELS - Path for data models
 * @property {string} SYNC_MODELS - Path for synchronized models
 * @property {string} LOGS - Path for log files
 * @property {string} VIEWS - Path for view files
 * @property {string} KEYS - Path for Kubernetes keys
 */
const PATHS = {
  TEMPLATES: ROOT + '/templates',
  CONTROLLERS: ROOT + '/controllers',
  DIAGRAMS: ROOT + '/context',
  SERVICES: ROOT + '/services',
  LOCALES: ROOT + '/config/i18n/locales',
  ROUTES: ROOT + '/routes',
  MODELS: ROOT + '/models',
  SYNC_MODELS: ROOT + '/sync_models',
  LOGS: ROOT + '/logs',
  VIEWS: ROOT + '/views',
  KEYS: ROOT + '/kubernetes/keys',
};

/**
 * Prefixes for different application modules/domains
 * @constant {Object}
 * @property {string} ADM - Administration module prefix
 * @property {string} CONFIG - Configuration module prefix
 * @property {string} DATA - Data module prefix
 * @property {string} DOC - Documents module prefix
 * @property {string} FIN - Financial module prefix
 * @property {string} GEO - Geographic module prefix
 * @property {string} HR - Human Resources module prefix
 * @property {string} INV - Inventory module prefix
 * @property {string} LOGS - Logs module prefix
 * @property {string} PRJ - Projects module prefix
 * @property {string} RD - Research and development module prefix
 * @property {string} SUP - Support module prefix
 * @property {string} TMPL - Templates module prefix
 * @property {string} USR - Users module prefix
 */
const PREFIXES = {
  ADM: 'administration',
  CONFIG: 'configurations',
  DATA: 'data',
  DOC: 'documents',
  FIN: 'financial',
  GEO: 'geographic',
  HR: 'human resources',
  INV: 'inventories',
  LOGS: 'logs',
  PRJ: 'projects',
  RD: 'research and development',
  SUP: 'support',
  TMPL: 'templates',
  USR: 'users',
};

/**
 * HTTP methods with their corresponding numeric values
 * @constant {Object}
 * @property {number} POST - POST method
 * @property {number} GET - GET method
 * @property {number} PUT - PUT method
 * @property {number} PATCH - PATCH method
 * @property {number} DELETE - DELETE method
 * @property {number} OPTIONS - OPTIONS method
 */
const METHODS = {
  POST: 1,
  GET: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5,
  OPTIONS: 6,
};

/**
 * Constants related to number handling and formatting
 * @constant {Object}
 * @property {number} DEFAULT_DECIMAL_PLACES - Default number of decimal places
 * @property {number} MAX_SAFE_INTEGER - Maximum safe integer value
 * @property {number} MIN_SAFE_INTEGER - Minimum safe integer value
 * @property {string} DEFAULT_CURRENCY - Default currency code
 * @property {string} DEFAULT_LOCALE - Default locale setting
 */
const NUMBER_CONSTANTS = {
  DEFAULT_DECIMAL_PLACES: 2,
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US',
};

const STRING_CONSTANTS = {
  DEFAULT_TRUNCATE_LENGTH: 50,
  DEFAULT_ELLIPSIS: '...',
  DEFAULT_WORD_WRAP_WIDTH: 80,

  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHA_ONLY: /^[a-zA-Z]+$/,
  NUMERIC_ONLY: /^[0-9]+$/,
  WHITESPACE: /\s/g,

  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN:
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,

  SPECIAL_CHARS: /[^\w\s]/g,
  DIACRITICS: /[\u0300-\u036f]/g,

  TITLE_CASE_EXCEPTIONS: [
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'if',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'so',
    'the',
    'to',
    'up',
    'yet',
  ],
};

const ESCAPE_SEQUENCES = {
  n: '⏎\n',
  t: '⇥',
  "'": "\\'",
  '"': '\\"',
  '/': '\\/',
  b: '⌫',
  f: '↡',
  r: '␍⏎',
};

const ALGORITHMS = {
  AES: 'aes-256-gcm',
  RSA: 'rsa',
  HASH: 'sha256',
  HMAC: 'sha256',
};

const KEY_SIZES = {
  RSA: 2048, // RSA key size in bits
  AES: 32, // AES key size in bytes (256 bits)
  IV: 16, // Initialization vector size in bytes
};

const CONTEXT_KEYS = {
  USER_ID: 'userId',
  USER_DATA: 'userData',
  SESSION_ID: 'sessionId',
  REQUEST_ID: 'requestId',
  IP_ADDRESS: 'ipAddress',
  USER_AGENT: 'userAgent',
  TIMESTAMP: 'timestamp',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  TENANT_ID: 'tenantId',
  CORRELATION_ID: 'correlationId',
  TRANSACTION_ID: 'transactionId',
  LOCALE: 'locale',
  TIMEZONE: 'timezone',
  API_KEY: 'apiKey',
  CLIENT_ID: 'clientId',
  ORGANIZATION_ID: 'organizationId',
  DEPARTMENT_ID: 'departmentId',
  CUSTOM_DATA: 'customData',
  SECURITY_CONTEXT: 'securityContext',
  AUDIT_CONTEXT: 'auditContext',
};

module.exports = {
  ROOT,
  PATHS,
  MODES,
  PREFIXES,
  METHODS,
  NUMBER_CONSTANTS,
  STRING_CONSTANTS,
  ESCAPE_SEQUENCES,
  ALGORITHMS,
  KEY_SIZES,
  CONTEXT_KEYS,
};
