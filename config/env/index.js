// --------------------------- CORE NODE.JS DEPENDENCIES --------------------------- //
const path = require('path');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const dotenv = require('dotenv');
const chalk = require('chalk');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const { MODES } = require('../../helpers/constants.helper');
const { environmentSchema } = require('./schema');

// ----------------------- ENVIRONMENT VARIABLE LOADING ---------------------- //
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ----------------- VALIDATION OF ENVIRONMENT VARIABLES ------------------ //
const validatedEnv = environmentSchema.safeParse(process.env);

if (!validatedEnv.success) {
  console.error(chalk.red.bold('❌ Invalid environment variables:\n'));

  validatedEnv.error.issues.forEach((err) => {
    console.error(chalk.red(`  • ${err.path.join('.')}: ${err.message}`));
  });
  process.exit(1);
}

const env = validatedEnv.data;

// ----------------- CONFIGURATION OBJECT CONSTRUCTION ------------------ //
const config = {
  // =============================================================================
  // ENVIRONMENT CONFIGURATION
  // =============================================================================
  mode: env.NODE_ENV,
  port: env.PORT,
  url: env.BASE_URL.replace('${PORT}', env.PORT.toString()),
  apiVersion: env.API_VERSION,
  isLocal: MODES[env.NODE_ENV] === 0,

  // Internationalization (using raw env vars as they are less critical)
  lang: process.env.DEFAULT_LANG,
  timeZone: process.env.DEFAULT_TIME_ZONE,
  supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || [],

  // =============================================================================
  // DATABASE CONFIGURATION
  // =============================================================================
  database: {
    // Primary Database (from validated env)
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    dialect: env.DB_DIALECT,
    ssl: process.env.DB_SSL === 'true', // Less critical, can remain as is

    // Connection Pool (using raw env vars with parsing)
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },

  // =============================================================================
  // CACHE & SESSION STORAGE
  // =============================================================================
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // =============================================================================
  // AUTHENTICATION & SECURITY
  // =============================================================================
  security: {
    // General
    cookieSecret: process.env.COOKIE_SECRET,
    sessionSecret: process.env.SESSION_SECRET,

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
  },

  jwt: {
    session: {
      secret: {
        access: env.JWT_SESSION_SECRET,
        refresh: env.JWT_REFRESH_SESSION_SECRET,
      },
      // Other JWT fields can remain as they are, using raw env vars
      subject: {
        access: process.env.JWT_SESSION_SUBJECT,
        refresh: process.env.JWT_REFRESH_SUBJECT,
      },
      expiration: {
        access: parseInt(process.env.JWT_SESSION_TOKEN_EXPIRATION_TIME, 10),
        refresh: parseInt(process.env.JWT_SESSION_REFRESH_TOKEN_EXPIRATION_TIME, 10),
      },
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
    },
  },

  // =============================================================================
  // CORS & SECURITY HEADERS
  // =============================================================================
  cors: {
    origin: env.CORS_ORIGIN.split(','),
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  },

  // NOTE: Other configurations are left as they were, using process.env directly.
  // This approach provides validation for the most critical parts of the app
  // without needing to create an exhaustive schema for all possible variables.
  // The schema can be expanded as needed.
};

// To keep the export clean, we merge the less critical, non-validated parts.
// This is just an example of how you might structure it.
// For simplicity in this refactoring, we'll rely on the structure above.

module.exports = config;
