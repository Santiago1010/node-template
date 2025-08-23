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

/**
 * Constants related to string operations and validation patterns
 * @constant {Object}
 * @property {number} DEFAULT_TRUNCATE_LENGTH - Default length for string truncation
 * @property {string} DEFAULT_ELLIPSIS - Default ellipsis character for truncation
 * @property {number} DEFAULT_WORD_WRAP_WIDTH - Default width for word wrapping
 * @property {RegExp} ALPHANUMERIC - Regex for alphanumeric characters only
 * @property {RegExp} ALPHA_ONLY - Regex for alphabetic characters only
 * @property {RegExp} NUMERIC_ONLY - Regex for numeric characters only
 * @property {RegExp} WHITESPACE - Regex for whitespace characters
 * @property {RegExp} EMAIL_PATTERN - Regex pattern for email validation
 * @property {RegExp} URL_PATTERN - Regex pattern for URL validation
 * @property {RegExp} PHONE_PATTERN - Regex pattern for phone number validation
 * @property {RegExp} SPECIAL_CHARS - Regex for special characters
 * @property {RegExp} DIACRITICS - Regex for diacritic characters
 * @property {Array<string>} TITLE_CASE_EXCEPTIONS - Words to exclude from title case conversion
 */
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

/**
 * Escape sequences mapping for special characters
 * @constant {Object}
 * @property {string} n - Newline escape sequence
 * @property {string} t - Tab escape sequence
 * @property {string} "'" - Single quote escape sequence
 * @property {string} '"' - Double quote escape sequence
 * @property {string} / - Forward slash escape sequence
 * @property {string} b - Backspace escape sequence
 * @property {string} f - Form feed escape sequence
 * @property {string} r - Carriage return escape sequence
 */
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

/**
 * Cryptographic algorithms used throughout the application
 * @constant {Object}
 * @property {string} AES - AES encryption algorithm
 * @property {string} RSA - RSA encryption algorithm
 * @property {string} HASH - Hashing algorithm
 * @property {string} HMAC - HMAC algorithm
 */
const ALGORITHMS = {
  AES: 'aes-256-gcm',
  RSA: 'rsa',
  HASH: 'sha256',
  HMAC: 'sha256',
};

/**
 * Key sizes for cryptographic operations (in bits/bytes)
 * @constant {Object}
 * @property {number} RSA - RSA key size in bits
 * @property {number} AES - AES key size in bytes
 * @property {number} IV - Initialization vector size in bytes
 */
const KEY_SIZES = {
  RSA: 2048, // RSA key size in bits
  AES: 32, // AES key size in bytes (256 bits)
  IV: 16, // Initialization vector size in bytes
};

/**
 * Context keys for request context and metadata storage
 * @constant {Object}
 * @property {string} USER_ID - Key for user identifier
 * @property {string} USER_DATA - Key for user data
 * @property {string} SESSION_ID - Key for session identifier
 * @property {string} REQUEST_ID - Key for request identifier
 * @property {string} IP_ADDRESS - Key for IP address
 * @property {string} USER_AGENT - Key for user agent string
 * @property {string} TIMESTAMP - Key for timestamp
 * @property {string} PERMISSIONS - Key for permissions data
 * @property {string} ROLES - Key for roles data
 * @property {string} TENANT_ID - Key for tenant identifier
 * @property {string} CORRELATION_ID - Key for correlation identifier
 * @property {string} TRANSACTION_ID - Key for transaction identifier
 * @property {string} LOCALE - Key for locale information
 * @property {string} TIMEZONE - Key for timezone information
 * @property {string} API_KEY - Key for API key
 * @property {string} CLIENT_ID - Key for client identifier
 * @property {string} ORGANIZATION_ID - Key for organization identifier
 * @property {string} DEPARTMENT_ID - Key for department identifier
 * @property {string} CUSTOM_DATA - Key for custom data
 * @property {string} SECURITY_CONTEXT - Key for security context
 * @property {string} AUDIT_CONTEXT - Key for audit context
 */
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

/**
 * Security configuration parameters and policies
 * @constant {Object}
 * @property {Object} RATE_LIMIT - Rate limiting configuration
 * @property {number} RATE_LIMIT.DEFAULT_WINDOW - Default time window in milliseconds
 * @property {number} RATE_LIMIT.DEFAULT_MAX_REQUESTS - Default maximum requests per window
 * @property {number} RATE_LIMIT.STRICT_WINDOW - Strict time window in milliseconds
 * @property {number} RATE_LIMIT.STRICT_MAX_REQUESTS - Strict maximum requests per window
 * @property {Object} PASSWORD_POLICY - Password policy configuration
 * @property {number} PASSWORD_POLICY.MIN_LENGTH - Minimum password length
 * @property {number} PASSWORD_POLICY.MAX_LENGTH - Maximum password length
 * @property {boolean} PASSWORD_POLICY.REQUIRE_UPPERCASE - Uppercase requirement flag
 * @property {boolean} PASSWORD_POLICY.REQUIRE_LOWERCASE - Lowercase requirement flag
 * @property {boolean} PASSWORD_POLICY.REQUIRE_NUMBERS - Numbers requirement flag
 * @property {boolean} PASSWORD_POLICY.REQUIRE_SPECIAL - Special characters requirement flag
 * @property {string} PASSWORD_POLICY.SPECIAL_CHARS - Allowed special characters
 * @property {Object} SESSION - Session configuration
 * @property {number} SESSION.MAX_AGE - Maximum session age in milliseconds
 * @property {number} SESSION.IDLE_TIMEOUT - Idle timeout in milliseconds
 * @property {number} SESSION.ABSOLUTE_TIMEOUT - Absolute timeout in milliseconds
 * @property {Object} CSRF - CSRF protection configuration
 * @property {number} CSRF.TOKEN_LENGTH - CSRF token length
 * @property {number} CSRF.TOKEN_EXPIRY - CSRF token expiry time in milliseconds
 * @property {Object} VALIDATION - Validation configuration
 * @property {number} VALIDATION.MAX_STRING_LENGTH - Maximum string length
 * @property {number} VALIDATION.MAX_ARRAY_LENGTH - Maximum array length
 * @property {number} VALIDATION.MAX_OBJECT_DEPTH - Maximum object depth
 */
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    DEFAULT_WINDOW: 15 * 60 * 1000, // 15 minutes in milliseconds
    DEFAULT_MAX_REQUESTS: 100,
    STRICT_WINDOW: 5 * 60 * 1000, // 5 minutes
    STRICT_MAX_REQUESTS: 20,
  },

  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },

  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  },

  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  },

  VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
  },
};

/**
 * Security patterns for input validation and threat detection
 * @constant {Object}
 * @property {RegExp} XSS - XSS attack pattern detection
 * @property {RegExp} SQL_INJECTION - SQL injection pattern detection
 * @property {RegExp} HTML_TAGS - HTML tags detection pattern
 * @property {RegExp} SPECIAL_CHARS - Special characters detection pattern
 * @property {RegExp} EMAIL - Email validation pattern
 * @property {RegExp} PHONE - Phone number validation pattern
 * @property {RegExp} IP_ADDRESS - IP address validation pattern
 * @property {RegExp} URL - URL validation pattern
 * @property {RegExp} UUID - UUID validation pattern
 * @property {RegExp} ALPHANUMERIC - Alphanumeric validation pattern
 * @property {RegExp} SLUG - URL slug validation pattern
 */
const SECURITY_PATTERNS = {
  XSS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  SQL_INJECTION: /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  HTML_TAGS: /<[^>]*>/g,
  SPECIAL_CHARS: /[<>\"'%;()&+]/g,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

/**
 * Threat level classifications for security events
 * @constant {Object}
 * @property {string} LOW - Low threat level
 * @property {string} MEDIUM - Medium threat level
 * @property {string} HIGH - High threat level
 * @property {string} CRITICAL - Critical threat level
 */
const THREAT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Configuration parameters for caching operations
 * @constant {Object}
 * @property {number} DEFAULT_TTL - Default time-to-live for cache entries in seconds
 * @property {number} MAX_KEY_LENGTH - Maximum allowed length for cache keys
 * @property {number} MAX_VALUE_SIZE - Maximum allowed size for cached values in bytes
 * @property {string} TAG_PREFIX - Prefix used for cache tagging
 * @property {string} METRICS_PREFIX - Prefix used for cache metrics
 * @property {string} LOCK_PREFIX - Prefix used for cache locking mechanisms
 * @property {number} DEFAULT_LOCK_TTL - Default time-to-live for cache locks in seconds
 */
const CACHE_CONFIG = {
  DEFAULT_TTL: 3600, // 1 hour in seconds
  MAX_KEY_LENGTH: 512,
  MAX_VALUE_SIZE: 1024 * 1024, // 1MB
  TAG_PREFIX: 'tag:',
  METRICS_PREFIX: 'metrics:',
  LOCK_PREFIX: 'lock:',
  DEFAULT_LOCK_TTL: 30, // 30 seconds
};

/**
 * Performance monitoring and optimization parameters
 * @constant {Object}
 * @property {number} DEFAULT_THROTTLE_DELAY - Default delay for throttle operations in milliseconds
 * @property {number} DEFAULT_DEBOUNCE_DELAY - Default delay for debounce operations in milliseconds
 * @property {number} MEMORY_WARNING_THRESHOLD - Memory usage threshold for warnings (percentage of available memory)
 * @property {number} CPU_WARNING_THRESHOLD - CPU usage threshold for warnings (percentage of total CPU capacity)
 */
const PERFORMANCE_CONFIG = {
  DEFAULT_THROTTLE_DELAY: 100,
  DEFAULT_DEBOUNCE_DELAY: 300,
  MEMORY_WARNING_THRESHOLD: 0.85, // 85% of available memory
  CPU_WARNING_THRESHOLD: 0.8, // 80% CPU usage
};

const DB_CONFIG = {
  SEARCH: {
    MAX_RESULTS: 1000,
    DEFAULT_LIMIT: 50,
    MIN_LIMIT: 1,
    OPERATORS: {
      LIKE: 'like',
      ILIKE: 'iLike',
      EXACT: 'exact',
      GT: 'gt',
      GTE: 'gte',
      LT: 'lt',
      LTE: 'lte',
      IN: 'in',
      NOT_IN: 'notIn',
      BETWEEN: 'between',
    },
  },

  PAGINATION_CONFIG: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
    DEFAULT_PAGE: 1,
    MIN_PAGE: 1,
  },
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
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
  SECURITY_CONFIG,
  SECURITY_PATTERNS,
  THREAT_LEVELS,
  CACHE_CONFIG,
  PERFORMANCE_CONFIG,
  DB_CONFIG,
};
