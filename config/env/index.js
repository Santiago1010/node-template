// =============================================================================
// Environment Configuration Loader - Validated Configuration Management
// =============================================================================
// Updated to reflect migration of sensitive variables to Vault
// This configuration now focuses on non-sensitive environment variables only
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { environmentSchema } = require('./schema');
const { MODES } = require('../../utils/constants.util');

// =============================================================================
// NATIVE .ENV FILE PARSER
// =============================================================================

/**
 * Parse .env file content into environment variables
 * Native implementation replacing dotenv functionality
 * @param {string} envPath - Path to .env file
 */
const loadEnvFile = (envPath) => {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse key=value pairs
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Only set if not already defined in process.env
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    // Silently ignore missing .env file (optional)
    if (error.code !== 'ENOENT') {
      console.error('Error loading .env file:', error.message);
    }
  }
};

// =============================================================================
// NATIVE COLOR CONSOLE UTILITIES
// =============================================================================

/**
 * Console color utilities using ANSI escape codes
 * Native implementation replacing chalk functionality
 */
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  redBold: (text) => `\x1b[31m\x1b[1m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

// =============================================================================
// ENVIRONMENT VALIDATION AND CONFIGURATION
// =============================================================================

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
loadEnvFile(envPath);

// Validate environment variables against schema
const validatedEnv = environmentSchema.safeParse(process.env);

// Exit with error message if validation fails
if (!validatedEnv.success) {
  console.error(colors.redBold('❌ Invalid environment variables:\n'));

  validatedEnv.error.issues.forEach((err) => {
    const path = err.path.join('.');
    console.error(colors.red(`  • ${path}: ${err.message}`));
  });

  process.exit(1);
}

// Extract validated environment variables
const env = validatedEnv.data;

// =============================================================================
// CONFIGURATION OBJECT CONSTRUCTION
// =============================================================================

/**
 * Application configuration object
 * Updated to reflect variables moved to Vault
 * Only contains non-sensitive configuration values
 */
const config = {
  // ===========================================================================
  // APPLICATION CONFIGURATION
  // ===========================================================================
  mode: process.env.NODE_ENV,
  port: process.env.PORT,
  url: process.env.BASE_URL.replace('${PORT}', env.PORT.toString()),
  isLocal: MODES[(env.NODE_ENV || 'development').toUpperCase()] === 0,
  name: process.env.PROJECT_NAME,

  // ===========================================================================
  // INTERNATIONALIZATION
  // ===========================================================================
  lang: process.env.DEFAULT_LANG,
  timeZone: {
    utc: process.env.DEFAULT_TIME_ZONE_UTC,
    name: process.env.DEFAULT_TIME_ZONE_NAME,
  },

  // ===========================================================================
  // DATABASE CONFIGURATION (Public settings only - credentials in Vault)
  // ===========================================================================
  database: {
    dialect: process.env.DB_DIALECT,
    ssl: process.env.DB_SSL === 'true',

    // Read Replica (public configuration)
    readReplica: {
      host: process.env.DB_READ_HOST,
      port: process.env.DB_READ_PORT,
    },

    // Connection Pool Configuration
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },

  // ===========================================================================
  // CACHE & SESSION STORAGE (Public settings only)
  // ===========================================================================
  cache: {
    // Redis Configuration (public endpoints only)
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      db: parseInt(env.REDIS_DB, 10) || 0,
    },
  },

  // ===========================================================================
  // SECURITY CONFIGURATION (Non-sensitive settings only)
  // ===========================================================================
  security: {
    defaultPasswordLength: parseInt(env.DEFAULT_PASSWORD_LENGTH, 10) || 8,

    // Rate limiting
    rateLimit: {
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
      maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
  },

  // ===========================================================================
  // JWT CONFIGURATION (Algorithm and expiration only - secrets in Vault)
  // ===========================================================================
  jwt: {
    algorithm: process.env.JWT_ALGORITHM,
    accessToken: {
      expiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    },
    refreshToken: {
      expiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    },
  },

  // ===========================================================================
  // CLOUD STORAGE & LOCALSTACK (Endpoints and regions only)
  // ===========================================================================
  cloudStorage: {
    // AWS S3 Configuration (public settings)
    aws: {
      s3: {
        endpoint: process.env.AWS_ENDPOINT_URL,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET,
        forcePathStyle: true,
      },
    },

    // Google Cloud Storage (public settings)
    googleCloud: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    },

    // Azure Blob Storage (public settings)
    azure: {
      container: process.env.AZURE_STORAGE_CONTAINER,
    },
  },

  // ===========================================================================
  // DEVELOPMENT & TESTING
  // ===========================================================================
  development: {
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL,
    faker: {
      locale: process.env.FAKER_LOCALE,
      seed: parseInt(env.FAKER_SEED, 10) || 12345,
    },
  },

  // ===========================================================================
  // CORS & SECURITY HEADERS
  // ===========================================================================
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  },

  securityHeaders: {
    csp: {
      defaultSrc: process.env.CSP_DEFAULT_SRC,
      scriptSrc: process.env.CSP_SCRIPT_SRC,
      styleSrc: process.env.CSP_STYLE_SRC,
    },
  },

  // ===========================================================================
  // APP SECURITY CONFIGURATION
  // ===========================================================================
  appSecurity: {
    bolaStrictMode: process.env.BOLA_STRICT_MODE === 'true',
    csrfEnabled: process.env.CSRF_ENABLED === 'true',
    csrfStrictMode: process.env.CSRF_STRICT_MODE === 'true',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 5,
    securityAuditEnabled: process.env.SECURITY_AUDIT_ENABLED === 'true',
    anomalyDetectionEnabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
  },

  // ===========================================================================
  // VAULT CONFIGURATION
  // ===========================================================================
  vault: {
    address: process.env.VAULT_ADDR,
    // Token should be injected at runtime for production
    // This is only for development
    token: process.env.VAULT_TOKEN,
  },
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = config;
