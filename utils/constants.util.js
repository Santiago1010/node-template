// =============================================================================
// APPLICATION CONSTANTS HELPER - Centralized Configuration Management
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Centralizes all application-wide constants, configurations, and paths
// - Provides single source of truth for environment modes, security settings, and file paths
// - Enables consistent configuration management across entire application stack
// - Supports multiple environments (production, development, test, local) with mode-based logic
//
// ARCHITECTURAL DECISIONS:
// - Centralized constants pattern chosen over scattered configuration files
// - All paths derived from application root for consistency and portability
// - Numeric environment modes enable easy comparison and mode checking
// - Grouped constants by domain (security, database, performance, etc.) for maintainability
// - Extensible design allows adding new constants without breaking existing code
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Environment-specific config files: Rejected due to complexity and duplication
// - Database-stored configuration: Rejected for performance and bootstrapping concerns
// - Separate files per constant group: Rejected to maintain single import point
// - Dynamic configuration loading: Rejected for type safety and startup predictability
// - Chosen approach provides: compile-time safety, easy refactoring, and IDE support
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for all constant accesses
// - Space complexity: O(n) where n is number of constants (minimal memory footprint)
// - Startup impact: Zero - all values computed at module load time
// - Runtime impact: Zero - all values are immutable constants
//
// SECURITY CONSIDERATIONS:
// - Contains sensitive configuration (key sizes, algorithms, security patterns)
// - No runtime modification prevents configuration tampering
// - Security patterns help prevent XSS, SQL injection, and other attacks
// - Sensitive fields list enables automatic data masking in logs
//
// USAGE EXAMPLES:
// - Basic usage: const { PATHS, MODES } = require('~/utils/constants.util.js');
// - Environment checking: if (currentMode >= MODES.PRODUCTION) { enableCaching(); }
// - Path resolution: const templatePath = PATHS.TEMPLATES + '/email.hbs';
// - Security validation: if (SECURITY_PATTERNS.EMAIL.test(email)) { proceed(); }
//
// MAINTENANCE & TROUBLESHOOTING:
// - Add new constants to appropriate domain group for consistency
// - Update documentation when adding/modifying constants
// - Test environment mode changes thoroughly in staging first
// - Monitor security pattern effectiveness and update as threats evolve
//
// DEPENDENCIES & COMPATIBILITY:
// - Node.js 14+ required for process.cwd() and object spread syntax
// - No third-party dependencies - pure Node.js implementation
// - Compatible with CommonJS and ES6 module systems
// - Environment-agnostic design works across all deployment targets
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
// No core Node.js dependencies required - pure constants implementation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
// No third-party dependencies required

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
// No internal dependencies - this is a foundational constants module

// =============================================================================
// APPLICATION ENVIRONMENT & MODES
// =============================================================================

/**
 * Environment modes with numeric values for easy comparison and validation
 * @constant {Object}
 * @description Defines application runtime environments with numeric values enabling
 *              easy environment checking (e.g., currentMode >= MODES.PRODUCTION)
 * @property {number} PRODUCTION - Production environment (highest security, full features)
 * @property {number} DEVELOPMENT - Development environment (debugging, hot reload)
 * @property {number} TEST - Test environment (automated testing, isolated databases)
 * @property {number} LOCAL - Local development (developer workstation, maximum logging)
 *
 * @example
 * // Environment checking
 * if (process.env.NODE_ENV === 'production') {
 *   currentMode = MODES.PRODUCTION;
 * }
 *
 * @example
 * // Feature flagging by environment
 * if (currentMode <= MODES.DEVELOPMENT) {
 *   enableDebugFeatures();
 * }
 *
 * @since Version 1.0.0
 * @see {@link process.env} for environment variable access
 */
const MODES = {
  PRODUCTION: 4,
  DEVELOPMENT: 2,
  TEST: 1,
  LOCAL: 0,
};

/**
 * Root directory of the application for consistent path resolution
 * @constant {string}
 * @description Derived from process.cwd() to ensure path consistency regardless
 *              of how the application is started or where it's run from
 *
 * @example
 * // Creating absolute paths
 * const absolutePath = ROOT + '/src/components';
 *
 * @complexity Time: O(1), Space: O(1)
 * @throws {Error} If process.cwd() cannot be determined (unlikely in normal operation)
 */
const ROOT = process.cwd();

// =============================================================================
// FILE SYSTEM & DIRECTORY PATHS
// =============================================================================

/**
 * Application directory structure and file paths
 * @constant {Object}
 * @description Centralized path management ensuring consistent file access across
 *              all application components. All paths are absolute from application root.
 * @property {string} TEMPLATES - View templates and email templates directory
 * @property {string} CONTROLLERS - Business logic controllers and route handlers
 * @property {string} DIAGRAMS - Architecture and context diagrams
 * @property {string} SERVICES - Business logic services and external API integrations
 * @property {string} LOCALES - Internationalization files and translation strings
 * @property {string} ROUTES - Route definitions and endpoint configurations
 * @property {string} MODELS - Data models and database schemas
 * @property {string} SYNC_MODELS - Synchronized models for real-time applications
 * @property {string} LOGS - Application logs and audit trails
 * @property {string} VIEWS - View templates and rendering components
 * @property {string} KEYS - Cryptographic keys and SSL certificates
 * @property {string} DEBUG - Debug information and development artifacts
 * @property {string} DOCS - Documentation files and API specifications
 * @property {string} DOCS_PATHS - Path documentation and routing diagrams
 * @property {string} ROUTES_DEFAULT - Common route definitions and endpoint configurations
 *
 * @example
 * // Reading a template file
 * const template = fs.readFileSync(PATHS.TEMPLATES + '/welcome.hbs', 'utf8');
 *
 * @example
 * // Writing application logs
 * const logStream = fs.createWriteStream(PATHS.LOGS + '/app.log', { flags: 'a' });
 *
 * @since Version 1.0.0
 * @see {@link ROOT} for base directory reference
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
  DEBUG: ROOT + '/.debug',
  DOCS: ROOT + '/docs',
  DOCS_PATHS: ROOT + '/docs/paths',
  ROUTES_DEFAULT: ROOT + '/routes',
  EMAIL_TEMPLATES: ROOT + '/templates/emails',
};

// =============================================================================
// APPLICATION NAMESPACING & PREFIXES
// =============================================================================

/**
 * Application module prefixes for namespacing and routing
 * @constant {Object}
 * @description Provides consistent prefixing for API routes, database collections,
 *              and module namespacing to prevent naming collisions
 * @property {string} ADM - Administration: user management, system configuration
 * @property {string} CONFIG - Configuration: application settings and preferences
 * @property {string} DATA - Data: data management and bulk operations
 * @property {string} DOC - Documents: file management and document processing
 * @property {string} FIN - Financial: payments, invoicing, accounting
 * @property {string} GEO - Geographic: maps, locations, spatial data
 * @property {string} HR - Human Resources: employees, payroll, benefits
 * @property {string} INV - Inventories: stock management, product catalogs
 * @property {string} LOGS - Logs: audit trails, system events, access logs
 * @property {string} PRJ - Projects: project management, tasks, timelines
 * @property {string} RD - Research and Development: experiments, prototypes
 * @property {string} SUP - Support: customer service, help desk, tickets
 * @property {string} TMPL - Templates: reusable templates and patterns
 * @property {string} USR - Users: user profiles, authentication, permissions
 *
 * @example
 * // API route namespacing
 * app.use('/api/' + PREFIXES.USR, userRoutes);
 *
 * @example
 * // Database collection naming
 * const userCollection = db.collection(PREFIXES.USR + '_profiles');
 *
 * @since Version 1.2.0
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

// =============================================================================
// NETWORK & HTTP CONSTANTS
// =============================================================================

/**
 * HTTP methods with numeric identifiers for efficient processing
 * @constant {Object}
 * @description Numeric representation of HTTP methods enabling fast comparison
 *              and efficient storage in databases or caches
 * @property {number} POST - Create new resources (value: 1)
 * @property {number} GET - Retrieve existing resources (value: 2)
 * @property {number} PUT - Replace entire resources (value: 3)
 * @property {number} PATCH - Partial resource updates (value: 4)
 * @property {number} DELETE - Remove resources (value: 5)
 * @property {number} OPTIONS - CORS and preflight requests (value: 6)
 *
 * @example
 * // Method validation in route handlers
 * if (requestMethod === METHODS.POST) {
 *   validateCreationPayload(request.body);
 * }
 *
 * @example
 * // Database storage optimization
 * await db.logs.insertOne({
 *   method: METHODS.GET,
 *   path: request.path,
 *   timestamp: new Date()
 * });
 *
 * @since Version 1.0.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods HTTP Methods}
 */
const METHODS = {
  POST: 1,
  GET: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5,
  OPTIONS: 6,
};

// =============================================================================
// DATA VALIDATION & PROCESSING
// =============================================================================

/**
 * Number handling, formatting, and validation constants
 * @constant {Object}
 * @description Centralized numeric configuration for consistent number processing
 *              across all application components and services
 * @property {number} DEFAULT_DECIMAL_PLACES - Default precision for decimal operations (2)
 * @property {number} MAX_SAFE_INTEGER - Maximum safe integer value (2^53 - 1)
 * @property {number} MIN_SAFE_INTEGER - Minimum safe integer value (-(2^53 - 1))
 * @property {string} DEFAULT_CURRENCY - Default currency code for financial operations (USD)
 * @property {string} DEFAULT_LOCALE - Default locale for number formatting (en-US)
 * @property {RegExp} NUMBER_REGEX - Pattern for validating numeric strings
 *
 * @example
 * // Number formatting with consistent decimals
 * const formatted = number.toFixed(NUMBER_CONSTANTS.DEFAULT_DECIMAL_PLACES);
 *
 * @example
 * // Numeric input validation
 * if (NUMBER_CONSTANTS.NUMBER_REGEX.test(input)) {
 *   return parseFloat(input);
 * }
 *
 * @since Version 1.3.0
 * @see {@link Number} for JavaScript number primitive
 */
const NUMBER_CONSTANTS = {
  DEFAULT_DECIMAL_PLACES: 2,
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US',
  NUMBER_REGEX: /^-?\d*\.?\d+$/,
};

/**
 * String operations, validation patterns, and text processing constants
 * @constant {Object}
 * @description Comprehensive string handling configuration including validation
 *              patterns, formatting rules, and text processing parameters
 * @property {number} DEFAULT_TRUNCATE_LENGTH - Default character limit for truncation (50)
 * @property {string} DEFAULT_ELLIPSIS - Ellipsis character for truncated text (...)
 * @property {number} DEFAULT_WORD_WRAP_WIDTH - Default line width for word wrapping (80)
 * @property {RegExp} ALPHANUMERIC - Alphanumeric characters only validation
 * @property {RegExp} ALPHA_ONLY - Alphabetic characters only validation
 * @property {RegExp} NUMERIC_ONLY - Numeric characters only validation
 * @property {RegExp} WHITESPACE - Whitespace character detection
 * @property {RegExp} EMAIL_PATTERN - RFC-compliant email validation pattern
 * @property {RegExp} URL_PATTERN - HTTP/HTTPS URL validation pattern
 * @property {RegExp} PHONE_PATTERN - International phone number validation
 * @property {RegExp} SPECIAL_CHARS - Special character detection
 * @property {RegExp} DIACRITICS - Diacritic character detection
 * @property {Array<string>} TITLE_CASE_EXCEPTIONS - Words excluded from title case
 *
 * @example
 * // Email validation
 * if (STRING_CONSTANTS.EMAIL_PATTERN.test(email)) {
 *   await sendWelcomeEmail(email);
 * }
 *
 * @example
 * // String truncation with ellipsis
 * const truncated = text.length > STRING_CONSTANTS.DEFAULT_TRUNCATE_LENGTH
 *   ? text.substring(0, STRING_CONSTANTS.DEFAULT_TRUNCATE_LENGTH) + STRING_CONSTANTS.DEFAULT_ELLIPSIS
 *   : text;
 *
 * @since Version 1.3.0
 * @see {@link String} for JavaScript string primitive
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
 * Character escape sequences for string processing and serialization
 * @constant {Object}
 * @description Mapping of escape sequence characters to their actual values
 *              used in JSON parsing, template rendering, and text processing
 * @property {string} n - Newline character (\n)
 * @property {string} t - Tab character (\t)
 * @property {string} "'" - Single quote (')
 * @property {string} '"' - Double quote (")
 * @property {string} / - Forward slash (/)
 * @property {string} b - Backspace character (\b)
 * @property {string} f - Form feed character (\f)
 * @property {string} r - Carriage return character (\r)
 * @property {string} \\ - Backslash character (\\)
 *
 * @example
 * // Custom JSON string escaping
 * const escaped = jsonString.replace(/\\(.)/g, (match, char) => {
 *   return ESCAPE_SEQUENCES[char] || char;
 * });
 *
 * @since Version 1.4.0
 * @see {@link JSON} for built-in JSON handling
 */
const ESCAPE_SEQUENCES = {
  n: '\n',
  t: '\t',
  "'": "'",
  '"': '"',
  '/': '/',
  b: '\b',
  f: '\f',
  r: '\r',
  '\\': '\\',
};

// =============================================================================
// SECURITY & CRYPTOGRAPHY
// =============================================================================

/**
 * Cryptographic algorithms for encryption, hashing, and security operations
 * @constant {Object}
 * @description Standardized cryptographic algorithm identifiers ensuring
 *              consistent security implementation across the application
 * @property {string} AES - AES-256-GCM symmetric encryption
 * @property {string} RSA - RSA asymmetric encryption and signing
 * @property {string} HASH - SHA-256 hashing algorithm
 * @property {string} HMAC - SHA-256 HMAC for message authentication
 *
 * @example
 * // Consistent encryption configuration
 * const cipher = crypto.createCipher(ALGORITHMS.AES, encryptionKey);
 *
 * @since Version 1.5.0
 * @see {@link https://nodejs.org/api/crypto.html Node.js Crypto Module}
 */
const ALGORITHMS = {
  AES: 'aes-256-gcm',
  RSA: 'rsa',
  HASH: 'sha256',
  HMAC: 'sha256',
};

/**
 * Cryptographic key and parameter sizes for security operations
 * @constant {Object}
 * @description Standardized key sizes ensuring adequate cryptographic strength
 *              and compliance with security best practices
 * @property {number} RSA - RSA key size in bits (2048 - minimum recommended)
 * @property {number} AES - AES key size in bytes (32 bytes = 256 bits)
 * @property {number} IV - Initialization vector size in bytes (16 bytes = 128 bits)
 *
 * @example
 * // Key generation with consistent sizes
 * const aesKey = crypto.randomBytes(KEY_SIZES.AES);
 * const iv = crypto.randomBytes(KEY_SIZES.IV);
 *
 * @since Version 1.5.0
 * @see {@link ALGORITHMS} for corresponding algorithm definitions
 */
const KEY_SIZES = {
  RSA: 2048, // RSA key size in bits
  AES: 32, // AES key size in bytes (256 bits)
  IV: 16, // Initialization vector size in bytes
};

/**
 * Comprehensive security configuration and policy definitions
 * @constant {Object}
 * @description Centralized security settings covering authentication,
 *              authorization, rate limiting, and input validation
 * @property {Object} RATE_LIMIT - Request rate limiting configuration
 * @property {number} RATE_LIMIT.DEFAULT_WINDOW - Default time window (15 minutes)
 * @property {number} RATE_LIMIT.DEFAULT_MAX_REQUESTS - Default requests per window (100)
 * @property {number} RATE_LIMIT.STRICT_WINDOW - Strict time window (5 minutes)
 * @property {number} RATE_LIMIT.STRICT_MAX_REQUESTS - Strict requests per window (20)
 * @property {Object} PASSWORD_POLICY - Password complexity requirements
 * @property {number} PASSWORD_POLICY.MIN_LENGTH - Minimum password length (8)
 * @property {number} PASSWORD_POLICY.MAX_LENGTH - Maximum password length (128)
 * @property {boolean} PASSWORD_POLICY.REQUIRE_UPPERCASE - Uppercase character required
 * @property {boolean} PASSWORD_POLICY.REQUIRE_LOWERCASE - Lowercase character required
 * @property {boolean} PASSWORD_POLICY.REQUIRE_NUMBERS - Numeric character required
 * @property {boolean} PASSWORD_POLICY.REQUIRE_SPECIAL - Special character required
 * @property {string} PASSWORD_POLICY.SPECIAL_CHARS - Allowed special characters
 * @property {number} PASSWORD_POLICY.SALT - bcrypt salt rounds (10)
 * @property {Object} SESSION - Session management configuration
 * @property {number} SESSION.MAX_AGE - Maximum session age (24 hours)
 * @property {number} SESSION.IDLE_TIMEOUT - Idle session timeout (30 minutes)
 * @property {number} SESSION.ABSOLUTE_TIMEOUT - Absolute session timeout (8 hours)
 * @property {Object} CSRF - CSRF protection configuration
 * @property {number} CSRF.TOKEN_LENGTH - CSRF token length (32 characters)
 * @property {number} CSRF.TOKEN_TTL - CSRF token expiry (1 hour)
 * @property {string} CSRF.HEADER_NAME - CSRF token header name
 * @property {string} CSRF.COOKIE_NAME - CSRF token cookie name
 * @property {Object} VALIDATION - Input validation limits
 * @property {number} VALIDATION.MAX_STRING_LENGTH - Maximum string length (10000)
 * @property {number} VALIDATION.MAX_ARRAY_LENGTH - Maximum array size (1000)
 * @property {number} VALIDATION.MAX_OBJECT_DEPTH - Maximum object depth (10)
 *
 * @example
 * // Password validation
 * if (password.length < SECURITY_CONFIG.PASSWORD_POLICY.MIN_LENGTH) {
 *   throw new Error('Password too short');
 * }
 *
 * @example
 * // Rate limiting configuration
 * const limiter = rateLimit({
 *   windowMs: SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW,
 *   max: SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS
 * });
 *
 * @since Version 1.7.0
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
    SALT: 10,
  },

  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  },

  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_TTL: 3600,
    HEADER_NAME: 'x-csrf-token',
    COOKIE_NAME: 'csrf-token',
  },

  VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
  },

  OTP: {
    LENGTH: 6,
    ALPHANUMERIC: false,
    EXPIRATION_MINUTES: 10,
    MAX_ATTEMPTS_PER_PERIOD: 3,
    RATE_LIMIT_PERIOD_MINUTES: 5,
    MAX_VERIFICATION_ATTEMPTS: 5,
  },

  TWO_FACTOR: {
    ENABLED_BY_DEFAULT: false,
    REQUIRE_FOR_SENSITIVE_OPERATIONS: true,
    GRACE_PERIOD_DAYS: 0,
    BACKUP_CODES_COUNT: 10,
    REMEMBER_DEVICE_DAYS: 30,
  },
};

/**
 * Security validation patterns for threat detection and input sanitization
 * @constant {Object}
 * @description Regular expression patterns for detecting and preventing
 *              common security vulnerabilities and malicious input
 * @property {RegExp} XSS - Cross-site scripting attack detection
 * @property {RegExp} SQL_INJECTION - SQL injection attempt detection
 * @property {RegExp} HTML_TAGS - HTML tag detection for content sanitization
 * @property {RegExp} SPECIAL_CHARS - Special character detection
 * @property {RegExp} EMAIL - Email address validation
 * @property {RegExp} PHONE - International phone number validation
 * @property {RegExp} IP_ADDRESS - IPv4 address validation
 * @property {RegExp} URL - HTTP/HTTPS URL validation
 * @property {RegExp} UUID - UUID v1-v5 validation
 * @property {RegExp} ALPHANUMERIC - Alphanumeric string validation
 * @property {RegExp} SLUG - URL slug validation (lowercase, hyphens)
 *
 * @example
 * // XSS prevention
 * const sanitized = input.replace(SECURITY_PATTERNS.XSS, '');
 *
 * @example
 * // Input validation
 * if (!SECURITY_PATTERNS.EMAIL.test(email)) {
 *   throw new Error('Invalid email format');
 * }
 *
 * @since Version 1.7.0
 * @see {@link SECURITY_CONFIG} for related security settings
 */
const SECURITY_PATTERNS = {
  XSS_PATTERNS: [/<script[^>]*>.*?<\/script>/gi, /on\w+\s*=/gi, /javascript:/gi, /<iframe/gi, /<object/gi, /<embed/gi],
  SQL_INJECTION_PATTERNS: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|\;|\*|\/\*|\*\/|xp_|sp_)/gi,
    /('|('')|;|--|\/\*|\*\/|xp_|sp_)/gi,
  ],
  NOSQL_INJECTION_PATTERNS: [/\$where/gi, /\$ne/gi, /\$gt/gi, /\$lt/gi, /\$regex/gi, /\$or/gi, /\$and/gi],
  COMMAND_INJECTION_PATTERNS: [/[;&|`$(){}[\]<>]/g, /\.\.\//g, /(curl|wget|nc|netcat|bash|sh|powershell|cmd)/gi],
  PATH_TRAVERSAL_PATTERNS: [/\.\.[\/\\]/g, /[\/\\]\.\./g, /%2e%2e/gi, /%252e/gi],
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
 * Threat level classifications for security incident severity
 * @constant {Object}
 * @description Standardized threat levels for security events enabling
 *              consistent incident response and priority handling
 * @property {string} LOW - Low severity: informational events, minor anomalies
 * @property {string} MEDIUM - Medium severity: suspicious activity, policy violations
 * @property {string} HIGH - High severity: attempted breaches, successful attacks
 * @property {string} CRITICAL - Critical severity: system compromise, data breach
 *
 * @example
 * // Security event classification
 * if (failedAttempts > 10) {
 *   threatLevel = THREAT_LEVELS.HIGH;
 *   triggerIncidentResponse();
 * }
 *
 * @since Version 1.7.0
 */
const THREAT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// =============================================================================
// PERFORMANCE & CACHING
// =============================================================================

/**
 * Caching configuration and performance optimization parameters
 * @constant {Object}
 * @description Centralized cache settings for consistent caching behavior
 *              across all application components and services
 * @property {number} DEFAULT_TTL - Default cache time-to-live in seconds (3600)
 * @property {number} MAX_KEY_LENGTH - Maximum cache key length in bytes (512)
 * @property {number} MAX_VALUE_SIZE - Maximum cache value size in bytes (1MB)
 * @property {string} TAG_PREFIX - Cache tag namespace prefix (tag:)
 * @property {string} METRICS_PREFIX - Cache metrics namespace prefix (metrics:)
 * @property {string} LOCK_PREFIX - Distributed lock namespace prefix (lock:)
 * @property {number} DEFAULT_LOCK_TTL - Default lock time-to-live in seconds (30)
 *
 * @example
 * // Cache configuration
 * const cache = new RedisCache({
 *   defaultTTL: CACHE_CONFIG.DEFAULT_TTL,
 *   maxValueSize: CACHE_CONFIG.MAX_VALUE_SIZE
 * });
 *
 * @since Version 1.8.0
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
 * Performance monitoring and optimization configuration
 * @constant {Object}
 * @description Performance-related settings for throttling, debouncing,
 *              and system resource monitoring
 * @property {number} DEFAULT_THROTTLE_DELAY - Default throttle delay in milliseconds (100)
 * @property {number} DEFAULT_DEBOUNCE_DELAY - Default debounce delay in milliseconds (300)
 * @property {number} MEMORY_WARNING_THRESHOLD - Memory usage warning threshold (0.85 = 85%)
 * @property {number} CPU_WARNING_THRESHOLD - CPU usage warning threshold (0.8 = 80%)
 *
 * @example
 * // Throttling expensive operations
 * const throttledSearch = throttle(performSearch, PERFORMANCE_CONFIG.DEFAULT_THROTTLE_DELAY);
 *
 * @example
 * // Resource monitoring
 * if (memoryUsage > PERFORMANCE_CONFIG.MEMORY_WARNING_THRESHOLD) {
 *   triggerGarbageCollection();
 * }
 *
 * @since Version 1.8.0
 */
const PERFORMANCE_CONFIG = {
  DEFAULT_THROTTLE_DELAY: 100,
  DEFAULT_DEBOUNCE_DELAY: 300,
  MEMORY_WARNING_THRESHOLD: 0.85, // 85% of available memory
  CPU_WARNING_THRESHOLD: 0.8, // 80% CPU usage
};

// =============================================================================
// DATABASE & STORAGE
// =============================================================================

/**
 * Database query configuration and search optimization parameters
 * @constant {Object}
 * @description Database operation settings including search limits,
 *              query operators, and pagination configuration
 * @property {Object} SEARCH - Search operation configuration
 * @property {number} SEARCH.MAX_RESULTS - Maximum search results (1000)
 * @property {number} SEARCH.DEFAULT_LIMIT - Default result limit (50)
 * @property {number} SEARCH.MIN_LIMIT - Minimum result limit (1)
 * @property {Object} SEARCH.OPERATORS - Supported query operators
 * @property {string} SEARCH.OPERATORS.LIKE - Case-sensitive pattern matching
 * @property {string} SEARCH.OPERATORS.ILIKE - Case-insensitive pattern matching
 * @property {string} SEARCH.OPERATORS.EXACT - Exact value matching
 * @property {string} SEARCH.OPERATORS.GT - Greater than comparison
 * @property {string} SEARCH.OPERATORS.GTE - Greater than or equal comparison
 * @property {string} SEARCH.OPERATORS.LT - Less than comparison
 * @property {string} SEARCH.OPERATORS.LTE - Less than or equal comparison
 * @property {string} SEARCH.OPERATORS.IN - Array membership check
 * @property {string} SEARCH.OPERATORS.NOT_IN - Array exclusion check
 * @property {string} SEARCH.OPERATORS.BETWEEN - Range comparison
 * @property {Object} PAGINATION_CONFIG - Pagination settings
 * @property {number} PAGINATION_CONFIG.DEFAULT_LIMIT - Default items per page (10)
 * @property {number} PAGINATION_CONFIG.MAX_LIMIT - Maximum items per page (100)
 * @property {number} PAGINATION_CONFIG.MIN_LIMIT - Minimum items per page (1)
 * @property {number} PAGINATION_CONFIG.DEFAULT_PAGE - Default page number (1)
 * @property {number} PAGINATION_CONFIG.MIN_PAGE - Minimum page number (1)
 *
 * @example
 * // Safe search with limits
 * const results = await User.find()
 *   .limit(DB_CONFIG.SEARCH.DEFAULT_LIMIT)
 *   .skip((page - 1) * limit);
 *
 * @example
 * // Query building with operators
 * const query = {
 *   age: { [DB_CONFIG.SEARCH.OPERATORS.GTE]: 18 },
 *   status: { [DB_CONFIG.SEARCH.OPERATORS.IN]: ['active', 'pending'] }
 * };
 *
 * @since Version 1.9.0
 */
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
// CLIENT & DEVICE MANAGEMENT
// =============================================================================

/**
 * Supported client device types for user agent detection and responsive behavior
 * @constant {Array<string>}
 * @description Comprehensive list of device types used for feature targeting,
 *              user interface adaptation, and analytics tracking
 *
 * @example
 * // Device detection and feature flagging
 * if (DEVICES.includes(userDevice)) {
 *   enableDeviceSpecificFeatures(userDevice);
 * }
 *
 * @since Version 1.5.0
 */
const DEVICES = ['common', 'web', 'app', 'wearable', 'desktop', 'bot'];

/**
 * Client device type classifications for analytics and feature targeting
 * @constant {Object}
 * @description Standardized device type identifiers for user agent parsing,
 *              responsive design, and device-specific functionality
 * @property {string} WEB_BROWSER - Traditional web browsers
 * @property {string} MOBILE_APP - Native mobile applications
 * @property {string} SMART_TV - Television and streaming applications
 * @property {string} IOT_DEVICE - Internet of Things devices
 * @property {string} DESKTOP_APP - Native desktop applications
 * @property {string} GAME_CONSOLE - Gaming consoles and systems
 *
 * @example
 * // Device-specific feature delivery
 * if (deviceType === DEVICE_TYPES.MOBILE_APP) {
 *   enableTouchGestures();
 *   optimizeForMobileData();
 * }
 *
 * @since Version 2.0.0
 */
const DEVICE_TYPES = {
  WEB_BROWSER: 'web_browser',
  MOBILE_APP: 'mobile_app',
  SMART_TV: 'smart_tv',
  IOT_DEVICE: 'iot_device',
  DESKTOP_APP: 'desktop_app',
  GAME_CONSOLE: 'game_console',
};

// =============================================================================
// LOGGING & MONITORING
// =============================================================================

/**
 * Log level definitions following syslog standard (RFC 5424)
 * @constant {Object}
 * @description Standardized log levels for consistent application logging
 *              and monitoring across all components and services
 * @property {number} emerg - Emergency: system is unusable (0)
 * @property {number} alert - Alert: immediate action required (1)
 * @property {number} crit - Critical: critical conditions (2)
 * @property {number} error - Error: error conditions (3)
 * @property {number} warn - Warning: warning conditions (4)
 * @property {number} notice - Notice: normal but significant (5)
 * @property {number} info - Informational: informational messages (6)
 * @property {number} debug - Debug: debug-level messages (7)
 *
 * @example
 * // Structured logging with levels
 * logger.log(LOG_LEVELS.INFO, 'User login successful', { userId, timestamp });
 *
 * @example
 * // Level-based log filtering
 * if (currentLogLevel >= LOG_LEVELS.WARN) {
 *   console.warn('High priority event detected', eventDetails);
 * }
 *
 * @since Version 2.0.0
 * @see {@link https://tools.ietf.org/html/rfc5424 RFC 5424 - The Syslog Protocol}
 */
const LOG_LEVELS = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warn: 4,
  notice: 5,
  info: 6,
  debug: 7,
};

/**
 * Console color mappings for log level visualization
 * @constant {Object}
 * @description Color associations for different log levels enabling
 *              immediate visual recognition of log message severity
 * @property {string} emerg - Red color for emergency level
 * @property {string} alert - Red color for alert level
 * @property {string} crit - Red color for critical level
 * @property {string} error - Red color for error level
 * @property {string} warn - Yellow color for warning level
 * @property {string} notice - Cyan color for notice level
 * @property {string} info - Green color for informational level
 * @property {string} debug - Blue color for debug level
 *
 * @example
 * // Colored console output
 * console[LOG_COLORS[level]](`[${level}] ${message}`);
 *
 * @since Version 2.0.0
 * @see {@link LOG_LEVELS} for corresponding log level definitions
 */
const LOG_COLORS = {
  emerg: 'red',
  alert: 'red',
  crit: 'red',
  error: 'red',
  warn: 'yellow',
  notice: 'cyan',
  info: 'green',
  debug: 'blue',
};

// =============================================================================
// DATA SENSITIVITY & PRIVACY
// =============================================================================

/**
 * Sensitive data field names for automatic masking and protection
 * @constant {Array<string>}
 * @description Field names containing sensitive information that should
 *              be automatically redacted from logs, responses, and exports
 *
 * @example
 * // Automatic field masking
 * const safeData = maskSensitiveFields(userData, SENSITIVE_FIELDS);
 *
 * @example
 * // Log sanitization
 * const sanitizedLog = redactSensitiveData(logEntry, SENSITIVE_FIELDS);
 *
 * @since Version 2.1.0
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'salt',
  'securityToken',
  'resetToken',
  'verificationToken',
  'apiKey',
  'apiSecret',
  'privateKey',
  'refreshToken',
  'accessToken',
  'sessionId',
  'sessionToken',
  'ssn',
  'taxId',
  'creditCard',
  'cvv',
  'pin',
  'bankAccount',
];

/**
 * Protected system fields that should not be modified by users
 * @constant {Array<string>}
 * @description System-managed fields that are controlled internally
 *              and should not be directly modified through user input
 *
 * @example
 * // Filtering protected fields from user input
 * const safeUpdate = omit(updateData, PROTECTED_FIELDS);
 *
 * @since Version 2.1.0
 */
const PROTECTED_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'password',
  'rolId',
  'securityLevel',
  'isAdmin',
  'isSuperAdmin',
  'permissions',
  'scopes',
  'verified',
  'emailConfirmedAt',
  'mobileNumberConfirmedAt',
];

/**
 * Role-based field protection for different user types
 * @constant {Object}
 * @description Defines which fields should be protected based on user roles,
 *              enabling fine-grained access control for different user types
 * @property {Array<string>} user - Fields protected for regular users
 * @property {Array<string>} admin - Fields protected for administrators
 * @property {Array<string>} system - Fields protected for system users
 *
 * @example
 * // Role-based field filtering
 * const allowedFields = getAccessibleFields(userRole, updateData);
 * const safeUpdate = pick(updateData, allowedFields);
 *
 * @since Version 2.1.0
 */
const ROLE_PROTECTED_FIELDS = {
  user: ['rolId', 'permissions', 'scopes', 'isAdmin'],
  admin: ['isSuperAdmin', 'systemRole'],
  system: [],
};

/**
 * Personally Identifiable Information fields for GDPR/Privacy compliance
 * @constant {Array<string>}
 * @description PII fields that require special handling under privacy regulations
 *              like GDPR, CCPA, and other data protection laws
 *
 * @example
 * // PII data anonymization
 * const anonymizedData = anonymizePII(userData, PII_FIELDS);
 *
 * @since Version 2.1.0
 */
const PII_FIELDS = [
  'email',
  'mobileNumber',
  'phoneNumber',
  'address',
  'fullAddress',
  'zipCode',
  'postalCode',
  'dateOfBirth',
  'birthDate',
  'identificationNumber',
  'passport',
  'driverLicense',
];

/**
 * Internal system fields for audit and operational purposes
 * @constant {Array<string>}
 * @description Internal operational fields used for system management,
 *              audit trails, and internal tracking purposes
 *
 * @example
 * // Filter internal fields from external responses
 * const externalResponse = omit(internalData, INTERNAL_FIELDS);
 *
 * @since Version 2.1.0
 */
const INTERNAL_FIELDS = [
  'deletedAt',
  'internalCode',
  'internalId',
  'systemId',
  'rolId',
  'employeeId',
  'createdBy',
  'updatedBy',
  'deletedBy',
];

// =============================================================================
// CONTEXT & REQUEST MANAGEMENT
// =============================================================================

/**
 * Context keys for request metadata and application state management
 * @constant {Object}
 * @description Standardized keys for storing and accessing request context
 *              information throughout the application lifecycle
 * @property {string} USER_ID - Authenticated user identifier
 * @property {string} USER_DATA - Complete user profile and preferences
 * @property {string} SESSION_ID - User session identifier
 * @property {string} REQUEST_ID - Unique request identifier for tracing
 * @property {string} IP_ADDRESS - Client IP address for geo-location and rate limiting
 * @property {string} USER_AGENT - Client browser/device information
 * @property {string} TIMESTAMP - Request initiation timestamp
 * @property {string} PERMISSIONS - User permissions and access rights
 * @property {string} ROLES - User roles and group memberships
 * @property {string} TENANT_ID - Multi-tenant organization identifier
 * @property {string} CORRELATION_ID - Request correlation for distributed tracing
 * @property {string} TRANSACTION_ID - Financial or business transaction identifier
 * @property {string} LOCALE - User language and regional preferences
 * @property {string} TIMEZONE - User timezone for date/time formatting
 * @property {string} API_KEY - API authentication key
 * @property {string} CLIENT_ID - OAuth client identifier
 * @property {string} ORGANIZATION_ID - User organization identifier
 * @property {string} DEPARTMENT_ID - User department or team identifier
 * @property {string} CUSTOM_DATA - Extended custom context data
 * @property {string} SECURITY_CONTEXT - Security and authentication context
 * @property {string} AUDIT_CONTEXT - Audit trail and compliance data
 *
 * @example
 * // Setting request context
 * context.set(CONTEXT_KEYS.USER_ID, authenticatedUser.id);
 * context.set(CONTEXT_KEYS.REQUEST_ID, generateUUID());
 *
 * @example
 * // Accessing context in business logic
 * const userId = context.get(CONTEXT_KEYS.USER_ID);
 * const userRoles = context.get(CONTEXT_KEYS.ROLES);
 *
 * @since Version 1.6.0
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

// =============================================================================
// DEBUG & DEVELOPMENT
// =============================================================================

/**
 * Debug and development configuration parameters
 * @constant {Object}
 * @description Development-specific settings for debugging, testing,
 *              and development environment optimization
 * @property {number} DEBUG_TIMEOUT_MINUTES - Debug operation timeout (1 minute)
 * @property {number} DEFAULT_LINE_LENGTH - Default line truncation length (150)
 * @property {number} DEVELOPMENT_MODE_VALUE - Development mode verbosity (2)
 *
 * @example
 * // Development-only debugging
 * if (process.env.NODE_ENV === 'development') {
 *   enableDetailedLogging(DEBUG_SETTINGS.DEVELOPMENT_MODE_VALUE);
 * }
 *
 * @since Version 2.1.0
 */
const DEBUG_SETTINGS = {
  DEBUG_TIMEOUT_MINUTES: 1,
  DEFAULT_LINE_LENGTH: 150,
  DEVELOPMENT_MODE_VALUE: 2,
};

// =============================================================================
// FILE HANDLING & STORAGE
// =============================================================================

/**
 * Amazon S3 storage configuration and operation parameters
 * @constant {Object}
 * @description S3-specific configuration for file uploads, downloads,
 *              and cloud storage operations
 * @property {number} DEFAULT_EXPIRATION - Signed URL expiration in seconds (3600)
 * @property {number} MAX_RETRIES - Maximum operation retry attempts (3)
 * @property {number} MULTIPART_THRESHOLD - Multipart upload threshold (100MB)
 * @property {number} PART_SIZE - Multipart part size (10MB)
 * @property {number} MAX_KEYS_PER_REQUEST - Maximum keys per list operation (1000)
 *
 * @example
 * // S3 client configuration
 * const s3 = new AWS.S3({
 *   maxRetries: S3_CONFIG.MAX_RETRIES,
 *   multipartUploadThreshold: S3_CONFIG.MULTIPART_THRESHOLD
 * });
 *
 * @since Version 2.2.0
 */
const S3_CONFIG = {
  DEFAULT_EXPIRATION: 3600,
  MAX_RETRIES: 3,
  MULTIPART_THRESHOLD: 100 * 1024 * 1024,
  PART_SIZE: 10 * 1024 * 1024,
  MAX_KEYS_PER_REQUEST: 1000,
};

/**
 * Allowed MIME types for secure file upload validation
 * @constant {Object}
 * @description Categorized MIME type validation for different file types,
 *              ensuring only safe and expected file types are processed
 * @property {Array<string>} image - Allowed image MIME types
 * @property {Array<string>} document - Allowed document MIME types
 * @property {Array<string>} spreadsheet - Allowed spreadsheet MIME types
 * @property {Array<string>} video - Allowed video MIME types
 * @property {Array<string>} audio - Allowed audio MIME types
 *
 * @example
 * // MIME type validation
 * if (ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
 *   await processImageUpload(file);
 * }
 *
 * @since Version 2.2.0
 */
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

/**
 * Dangerous file extensions that should be blocked from upload
 * @constant {Array<string>}
 * @description Executable and potentially dangerous file extensions
 *              that should be automatically rejected for security
 *
 * @example
 * // File extension validation
 * if (DANGEROUS_EXTENSIONS.some(ext => filename.endsWith(ext))) {
 *   throw new Error('File type not allowed');
 * }
 *
 * @since Version 2.2.0
 */
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.msi',
  '.app',
  '.deb',
  '.rpm',
  '.dmg',
  '.pkg',
  '.sh',
  '.bash',
  '.ps1',
];

/**
 * File signature mappings for content-type validation
 * @constant {Object}
 * @description Hex signature to MIME type mappings for validating
 *              file contents regardless of extension or declared type
 * @property {string} ffd8ffe0 - JPEG image signature
 * @property {string} ffd8ffe1 - JPEG image signature
 * @property {string} ffd8ffe2 - JPEG image signature
 * @property {string} 89504e47 - PNG image signature
 * @property {string} 47494638 - GIF image signature
 * @property {string} 52494646 - WEBP image signature
 * @property {string} 25504446 - PDF document signature
 * @property {string} 504b0304 - ZIP archive signature
 * @property {string} 504b0506 - ZIP archive signature
 * @property {string} 504b0708 - ZIP archive signature
 *
 * @example
 * // File content validation
 * const fileSignature = fileBuffer.toString('hex', 0, 4);
 * const detectedType = FILE_SIGNATURE_MAP[fileSignature];
 *
 * @since Version 2.2.0
 */
const FILE_SIGNATURE_MAP = {
  ffd8ffe0: 'image/jpeg',
  ffd8ffe1: 'image/jpeg',
  ffd8ffe2: 'image/jpeg',
  '89504e47': 'image/png',
  47494638: 'image/gif',
  52494646: 'image/webp',
  25504446: 'application/pdf',
  '504b0304': 'application/zip',
  '504b0506': 'application/zip',
  '504b0708': 'application/zip',
};

const VAULT_PATHS = {
  RSA_KEYS_PATH: 'encryption/rsa-keys',
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * Application Constants Module
 * @module utils/constants
 * @description Centralized configuration management providing single source
 *              of truth for all application constants, paths, and settings
 *
 * @example
 * // Import specific constant groups
 * const { PATHS, MODES, SECURITY_CONFIG } = require('~/utils/constants.util.js');
 *
 * @example
 * // Import all constants
 * const CONSTANTS = require('~/utils/constants.util.js');
 *
 * @since Version 1.0.0
 */
module.exports = {
  // Application Environment & Modes
  ROOT,
  MODES,

  // File System & Directory Paths
  PATHS,

  // Application Namespacing & Prefixes
  PREFIXES,

  // Network & HTTP Constants
  METHODS,

  // Data Validation & Processing
  NUMBER_CONSTANTS,
  STRING_CONSTANTS,
  ESCAPE_SEQUENCES,

  // Security & Cryptography
  ALGORITHMS,
  KEY_SIZES,
  SECURITY_CONFIG,
  SECURITY_PATTERNS,
  THREAT_LEVELS,

  // Performance & Caching
  CACHE_CONFIG,
  PERFORMANCE_CONFIG,

  // Database & Storage
  DB_CONFIG,

  // Client & Device Management
  DEVICES,
  DEVICE_TYPES,

  // Logging & Monitoring
  LOG_LEVELS,
  LOG_COLORS,

  // Data Sensitivity & Privacy
  SENSITIVE_FIELDS,
  PROTECTED_FIELDS,
  ROLE_PROTECTED_FIELDS,
  PII_FIELDS,
  INTERNAL_FIELDS,

  // Context & Request Management
  CONTEXT_KEYS,

  // Debug & Development
  DEBUG_SETTINGS,

  // File Handling & Storage
  S3_CONFIG,
  ALLOWED_MIME_TYPES,
  DANGEROUS_EXTENSIONS,
  FILE_SIGNATURE_MAP,

  // Vault Management
  VAULT_PATHS,
};
