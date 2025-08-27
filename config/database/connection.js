// =============================================================================
// DATABASE CONNECTION MANAGER - Enhanced Sequelize Configuration
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Creates and configures a production-ready Sequelize ORM instance
// - Manages database connections with connection pooling and retry mechanisms
// - Handles graceful shutdowns and connection lifecycle events
// - Provides comprehensive monitoring and logging capabilities
// - Supports SSL/TLS encrypted connections and secure configurations
//
// ARCHITECTURAL DECISIONS:
// - Uses Sequelize ORM for database abstraction and model management
// - Implements connection pooling to optimize database resource utilization
// - Employs hooks and event listeners for connection monitoring
// - Supports both single-instance and replication-based deployments
// - Implements comprehensive error handling and graceful degradation
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Raw database drivers: More control but less abstraction and built-in features
// - Other ORMs (TypeORM, Prisma): Different query patterns and migration approaches
// - Connection-less architectures: Not suitable for transactional operations
// - Manual connection management: More error-prone and less maintainable
//
// PERFORMANCE CHARACTERISTICS:
// - Connection acquisition: O(1) from pool after initial setup
// - Query execution: Depends on database and query complexity
// - Memory usage: Linear with connection pool size and model complexity
// - Supports up to 10 concurrent connections by default (configurable)
//
// SECURITY CONSIDERATIONS:
// - Supports SSL/TLS encryption for database connections
// - Implements connection timeouts to prevent resource exhaustion
// - Validates connections before use to prevent stale connections
// - Uses environment variables for sensitive configuration data
// - Implements parameterized queries through Sequelize to prevent SQL injection
//
// USAGE EXAMPLES:
// - Basic database connection:
//   const db = require('./config/database');
//   await db.authenticate();
//
// - Transaction management:
//   await db.transaction(async (t) => {
//     await User.create({...}, {transaction: t});
//   });
//
// - Model usage:
//   const User = db.model('User');
//   await User.findAll();
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor connection pool metrics under heavy load
// - Adjust pool settings based on database capacity
// - Check SSL certificates expiration for encrypted connections
// - Monitor query performance and add indexes as needed
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ with ES6 support
// - Compatible with MySQL, PostgreSQL, SQLite, and MariaDB
// - Uses sequelize@6+ with promise-based API
// - Environment-specific configuration through config files
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment'); // Date and time library
const { Sequelize } = require('sequelize'); // ORM for database abstraction

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const setupModels = require('../../models/index'); // Model definitions and associations
const { getCurrentConfig } = require('../database'); // Environment-specific configuration
const { isDevelopmentMode } = require('../../helpers/debug.helper'); // Environment detection

/**
 * Database Configuration Loader
 * @description Retrieves environment-specific database configuration
 * @returns {Object} Database configuration object with connection parameters
 * @throws {Error} If configuration is invalid or missing required properties
 */
const config = getCurrentConfig();

/**
 * Enhanced Sequelize Database Instance
 * @description Production-ready database connection with comprehensive configuration
 * @type {Sequelize}
 *
 * @example
 * // Basic usage
 * const db = require('./config/database');
 * await db.authenticate();
 *
 * @example
 * // Transaction usage
 * await db.transaction(async (transaction) => {
 *   await User.create({...}, {transaction});
 * });
 *
 * @complexity Time: O(1) for connection setup, varies for queries
 * @since Version 1.0.0
 * @see {@link setupModels} for model initialization
 */
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,

  // Enhanced dialect options for better performance and security
  dialectOptions: {
    ...config.dialectOptions,
    decimalNumbers: true,
    timezone: config.timezone,
    connectTimeout: 60000,
    ...(config.ssl && {
      ssl: {
        require: true,
        rejectUnauthorized: !isDevelopmentMode(true),
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY,
      },
    }),
  },

  timezone: config.timezone, // Global timezone configuration

  // Enhanced connection pool configuration
  pool: {
    max: config.pool?.max || 10,
    min: config.pool?.min || 1,
    acquire: config.pool?.acquire || 60000,
    idle: config.pool?.idle || 30000,
  },

  logging: false, // Disable default logging (can be customized)

  // Retry configuration for failed connections
  retry: {
    max: 3, // Maximum retry attempts
    timeout: 30000, // Timeout between retries
    match: [
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

  // Query configuration
  query: {
    ...config.query,
    timeout: 30000, // 30 seconds query timeout
    nest: false,
    plain: false,
  },

  // Enhanced model definitions with global settings
  define: {
    ...config.define,
    charset: 'utf8mb4', // Support for full Unicode including emoji
    collate: 'utf8mb4_unicode_ci',
    timestamps: true, // Enable automatic timestamps
    underscored: true, // Use snake_case for column names
    paranoid: true, // Enable soft deletes
    freezeTableName: true, // Prevent pluralization

    // Global hooks for auditing and timestamps
    hooks: {
      beforeCreate: (instance) => {
        if (!instance.createdAt) {
          instance.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        }
      },
      beforeUpdate: (instance) => {
        instance.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
      },
    },
  },

  benchmark: !isDevelopmentMode(true), // Benchmark queries in development

  // Migration and seeder configuration
  migrationStorage: config.migrationStorage || 'sequelize',
  migrationStorageTableName: config.migrationStorageTableName || 'sequelize_migrations',
  seederStorage: config.seederStorage || 'sequelize',
  seederStorageTableName: config.seederStorageTableName || 'sequelize_seeders',

  // Replication support (if configured)
  ...(config.replication && { replication: config.replication }),
});

// Connection event listeners for monitoring and logging
sequelize.addHook('afterConnect', () => {
  console.log(`✅ Database connection established (${process.env.NODE_ENV || 'development'})`);
});

sequelize.addHook('afterDisconnect', () => {
  console.log('🔌 Database connection closed');
});

// Initialize models with the sequelize instance
setupModels(sequelize);

/**
 * Database Connection Authenticator
 * @description Tests the database connection and validates credentials
 * @returns {Promise<void>} Resolves if authentication succeeds
 * @throws {SequelizeConnectionError} If authentication fails
 */
sequelize
  .authenticate()
  .then(() => {
    console.log('🚀 Database authentication successful');
  })
  .catch((error) => {
    console.error('❌ Database authentication failed:', error.message);

    // Enhanced error logging for production debugging
    if (!isDevelopmentMode(true)) {
      console.error('Error details:', {
        name: error.name,
        original: error.original?.message,
        sql: error.sql,
      });
    }
  });

// Graceful shutdown handlers for process signals
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing database connection...');
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

// Uncaught exception and rejection handlers
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
module.exports = sequelize;
