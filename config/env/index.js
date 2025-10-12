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
  mode: env.NODE_ENV,
  port: env.PORT,
  url: env.BASE_URL.replace('${PORT}', env.PORT.toString()),
  isLocal: MODES[(env.NODE_ENV || 'development').toUpperCase()] === 0,
  name: env.PROJECT_NAME,

  // ===========================================================================
  // INTERNATIONALIZATION
  // ===========================================================================
  lang: env.DEFAULT_LANG,
  timeZone: {
    utc: env.DEFAULT_TIME_ZONE_UTC,
    name: env.DEFAULT_TIME_ZONE_NAME,
  },

  // ===========================================================================
  // DATABASE CONFIGURATION (Public settings only - credentials in Vault)
  // ===========================================================================
  database: {
    dialect: env.DB_DIALECT,
    ssl: env.DB_SSL === 'true',

    // Read Replica (public configuration)
    readReplica: {
      host: env.DB_READ_HOST,
      port: env.DB_READ_PORT,
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
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      db: parseInt(env.REDIS_DB, 10) || 0,
      localUrl: env.REDIS_URL_LOCAL,
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
    algorithm: env.JWT_ALGORITHM,
    accessToken: {
      expiration: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    },
    refreshToken: {
      expiration: env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    },
  },

  // ===========================================================================
  // CLOUD STORAGE & LOCALSTACK (Endpoints and regions only)
  // ===========================================================================
  cloudStorage: {
    // AWS S3 Configuration (public settings)
    aws: {
      s3: {
        endpoint: env.AWS_ENDPOINT_URL,
        region: env.AWS_REGION,
        bucket: env.AWS_S3_BUCKET,
        forcePathStyle: true,
      },
    },

    // Google Cloud Storage (public settings)
    googleCloud: {
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      bucket: env.GOOGLE_CLOUD_STORAGE_BUCKET,
    },

    // Azure Blob Storage (public settings)
    azure: {
      container: env.AZURE_STORAGE_CONTAINER,
    },
  },

  // ===========================================================================
  // DEVELOPMENT & TESTING
  // ===========================================================================
  development: {
    debug: env.DEBUG === 'true',
    logLevel: env.LOG_LEVEL,
    faker: {
      locale: env.FAKER_LOCALE,
      seed: parseInt(env.FAKER_SEED, 10) || 12345,
    },
  },

  // ===========================================================================
  // CORS & SECURITY HEADERS
  // ===========================================================================
  cors: {
    origin: env.CORS_ORIGIN,
    methods: env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  securityHeaders: {
    csp: {
      defaultSrc: env.CSP_DEFAULT_SRC,
      scriptSrc: env.CSP_SCRIPT_SRC,
      styleSrc: env.CSP_STYLE_SRC,
    },
  },

  // ===========================================================================
  // APP SECURITY CONFIGURATION
  // ===========================================================================
  appSecurity: {
    bolaStrictMode: env.BOLA_STRICT_MODE === 'true',
    csrfEnabled: env.CSRF_ENABLED === 'true',
    csrfStrictMode: env.CSRF_STRICT_MODE === 'true',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 5,
    securityAuditEnabled: env.SECURITY_AUDIT_ENABLED === 'true',
    anomalyDetectionEnabled: env.ANOMALY_DETECTION_ENABLED === 'true',
  },

  // ===========================================================================
  // VAULT CONFIGURATION
  // ===========================================================================
  vault: {
    address: env.VAULT_ADDR,
    // Token should be injected at runtime for production
    // This is only for development
    token: env.VAULT_TOKEN,
  },
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = config;
