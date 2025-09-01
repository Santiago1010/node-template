// =============================================================================
// DATABASE CONNECTION MANAGER - Enhanced Sequelize ORM Configuration
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Centralized database connection management using Sequelize ORM
// - Handles connection pooling, SSL configuration, and timezone management
// - Provides automated timestamp handling and graceful shutdown procedures
// - Supports both single-instance and replication-based database configurations
//
// ARCHITECTURAL DECISIONS:
// - Uses Sequelize ORM for standardized database interaction across SQL dialects
// - Implements connection pooling to optimize database performance
// - Incorporates automatic timestamp handling using Moment.js for consistency
// - Follows paranoid deletion pattern with underscored naming conventions
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Raw database drivers: Would provide more control but require manual query building
// - Knex.js: More lightweight but lacks built-in ORM features
// - TypeORM: TypeScript-focused but has steeper learning curve
// - Chose Sequelize for its balance of features, stability, and community support
//
// PERFORMANCE CHARACTERISTICS:
// - Connection pooling: O(1) for connection acquisition from pool
// - Query execution: Varies by query complexity and database engine
// - Memory usage: Proportional to connection pool size and result sets
// - Recommended pool sizes: Production (10-20), Development (5-10)
//
// SECURITY CONSIDERATIONS:
// - SSL encryption for database connections in production environments
// - Environment-specific certificate management
// - Input sanitization handled at ORM level through parameterized queries
// - No raw SQL execution in this module to prevent injection vulnerabilities
//
// USAGE EXAMPLES:
// - Basic connection:
//   const { sequelize, models } = require('./config/database');
//   await sequelize.authenticate();
//
// - Model usage:
//   const users = await models.User.findAll();
//
// - Transaction handling:
//   await sequelize.transaction(async (t) => { /* operations */ });
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor connection pool usage through Sequelize statistics
// - Common errors: Connection timeout, authentication failures
// - Debugging: Enable logging in development mode
// - Ensure SSL certificates are regularly rotated in production
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ with ES6 support
// - Compatible with MySQL, PostgreSQL, SQLite, and MariaDB
// - Third-party dependencies: Sequelize 6+, Moment.js 2.27+
// - Environment variables required for SSL configuration
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment'); // Date manipulation and formatting
const { Sequelize } = require('sequelize'); // ORM for database interaction

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const setupModels = require('../../models/index'); // Model initialization function
const { getCurrentConfig } = require('../database'); // Database configuration loader
const { isDevelopmentMode } = require('../../helpers/debug.helper'); // Environment detection helper

/**
 * Database Configuration Loader
 * @description Loads environment-specific database configuration
 * @returns {Object} Database configuration object with connection parameters
 * @throws {Error} If required configuration values are missing
 */
const config = getCurrentConfig();

/**
 * Enhanced Sequelize Database Instance
 * @description Central database connection instance with optimized configuration
 * @type {Sequelize}
 *
 * @example
 * // Basic usage
 * const { sequelize } = require('./database');
 * await sequelize.authenticate();
 *
 * @example
 * // Transaction handling
 * const result = await sequelize.transaction(async (transaction) => {
 *   // Database operations
 * });
 *
 * @complexity Time: O(1) for initialization, Space: O(n) where n = pool size
 * @since Version 1.0.0
 * @see {@link https://sequelize.org/docs/v6/} for Sequelize documentation
 */
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,

  dialectOptions: {
    ...config.dialectOptions,
    decimalNumbers: true, // Ensure decimal numbers are returned as floats
    timezone: config.timezone, // Synchronize database timezone with application
    connectTimeout: 60000, // 60-second connection timeout
    ...(config.ssl && {
      // SSL configuration for production environments
      ssl: {
        require: true,
        rejectUnauthorized: !isDevelopmentMode(true), // Allow self-signed certs in development
        ca: process.env.DB_SSL_CA, // Certificate authority
        cert: process.env.DB_SSL_CERT, // Client certificate
        key: process.env.DB_SSL_KEY, // Client private key
      },
    }),
  },

  timezone: config.timezone, // Application-level timezone configuration

  pool: {
    max: config.pool?.max || 10, // Maximum concurrent connections
    min: config.pool?.min || 1, // Minimum maintained connections
    acquire: config.pool?.acquire || 60000, // Connection acquisition timeout (ms)
    idle: config.pool?.idle || 30000, // Idle connection timeout (ms)
  },

  logging: false, // Disable default logging (can be overridden)

  retry: {
    // Connection retry configuration
    max: 3, // Maximum retry attempts
    timeout: 30000, // Retry timeout period
    match: [
      // Error types that should trigger retry
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /TIMEOUT/,
      /PROTOCOL_CONNECTION_LOST/,
      Sequelize.ConnectionError,
      Sequelize.ConnectionTimedOutError,
      Sequelize.TimeoutError,
    ],
  },

  query: {
    ...config.query,
    timeout: 30000, // Query execution timeout (ms)
    nest: false, // Disable nested object creation
    plain: false, // Always return full result sets
  },

  define: {
    ...config.define,
    charset: 'utf8mb4', // Support full Unicode including emojis
    collate: 'utf8mb4_unicode_ci', // Case-insensitive Unicode collation
    timestamps: true, // Enable automated timestamp fields
    underscored: true, // Use snake_case rather than camelCase
    paranoid: true, // Enable soft deletion (deleted_at field)
    freezeTableName: true, // Prevent pluralization of table names

    hooks: {
      /**
       * BeforeCreate Hook
       * @description Sets createdAt timestamp using consistent formatting
       * @param {Model} instance - Sequelize model instance being created
       */
      beforeCreate: (instance) => {
        if (!instance.createdAt) {
          instance.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        }
      },

      /**
       * BeforeUpdate Hook
       * @description Updates updatedAt timestamp using consistent formatting
       * @param {Model} instance - Sequelize model instance being updated
       */
      beforeUpdate: (instance) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
      },
    },
  },

  benchmark: !isDevelopmentMode(true), // Enable performance benchmarking in production

  migrationStorage: config.migrationStorage || 'sequelize',
  migrationStorageTableName: config.migrationStorageTableName || 'sequelize_migrations',
  seederStorage: config.seederStorage || 'sequelize',
  seederStorageTableName: config.seederStorageTableName || 'sequelize_seeders',

  ...(config.replication && { replication: config.replication }), // Read-replica support
});

// Connection event listeners
sequelize.addHook('afterConnect', () => {
  console.log(`✅ Database connection established (${process.env.NODE_ENV || 'development'})`);
});

sequelize.addHook('afterDisconnect', () => {
  console.log('🔌 Database connection closed');
});

/**
 * Model Initialization
 * @description Sets up all Sequelize models and associations
 * @param {Sequelize} sequelizeInstance - Configured Sequelize instance
 * @returns {Object} Map of initialized models
 * @throws {Error} If model initialization fails
 */
const models = setupModels(sequelize);

// Database authentication
sequelize
  .authenticate()
  .then(() => {
    console.log('🚀 Database authentication successful');
  })
  .catch((error) => {
    console.error('❌ Database authentication failed:', error.message);

    if (!isDevelopmentMode(true)) {
      console.error('Error details:', {
        name: error.name,
        original: error.original?.message,
        sql: error.sql,
      });
    }
  });

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  if (!isDevelopmentMode(true)) console.log('🛑 SIGTERM received, closing database connection...');
  sequelize.close().then(() => {
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing database connection...');
  sequelize.close().then(() => {
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  sequelize.close().then(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  sequelize.close().then(() => {
    process.exit(1);
  });
});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { sequelize, models, ...models };
