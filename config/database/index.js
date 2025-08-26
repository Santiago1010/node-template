// =============================================================================
// DATABASE CONFIGURATION MODULE - Sequelize ORM Configuration & Management
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Centralized database configuration management for Sequelize ORM
// - Environment-specific configuration (development, test, production, local)
// - Connection pooling and performance optimization
// - Read replica configuration support
// - Database connection lifecycle management
//
// ARCHITECTURAL DECISIONS:
// - Environment-based configuration to support different deployment scenarios
// - Connection pooling to optimize database resource utilization
// - Read/write replication support for scaling read operations
// - Singleton configuration pattern for consistent database access
// - SSL/TLS support for secure database connections
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Environment variables directly: Less maintainable, no validation
// - Separate config files per environment: More complex to manage
// - ORM alternatives (TypeORM, Knex): Sequelize chosen for maturity and features
// - Connection per request vs pooling: Pooling selected for performance
//
// PERFORMANCE CHARACTERISTICS:
// - Connection pooling: O(1) for connection acquisition
// - Query execution: Depends on database and query complexity
// - Memory: Constant overhead for connection pool
// - Scalability: Linear scaling with connection pool size
//
// SECURITY CONSIDERATIONS:
// - SSL encryption for database connections
// - Credential management through environment variables
// - SQL injection protection through Sequelize parameterization
// - Read-only user support for read replicas
//
// USAGE EXAMPLES:
// - Basic connection: const sequelize = createSequelizeInstance()
// - Connection testing: await testConnection()
// - Multi-environment support: NODE_ENV=production node app.js
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor connection pool usage
// - Adjust pool settings based on load
// - Handle database failover scenarios
// - Regular Sequelize version updates
//
// DEPENDENCIES & COMPATIBILITY:
// - Sequelize v6+ (ORM library)
// - Node.js 14+ (Async/await support)
// - PostgreSQL/MySQL/MariaDB/SQLite (Supported dialects)
// - TLS 1.2+ for encrypted connections
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
// None - Pure configuration module

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Sequelize } = require('sequelize'); // ORM library for database operations

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const config = require('../env'); // Application configuration and environment variables

// =============================================================================
// DATABASE CONFIGURATION OBJECT
// =============================================================================

/**
 * Database configuration for multiple environments
 * Supports Sequelize CLI and programmatic usage
 * @type {Object}
 * @property {Object} development - Development environment configuration
 * @property {Object} test - Test environment configuration
 * @property {Object} staging - Staging environment configuration
 * @property {Object} production - Production environment configuration
 * @property {Object} local - Local development configuration
 * @property {Object} admin - Administrative connection configuration
 *
 * @example
 * // Usage in application
 * const dbConfig = require('./config/database');
 * const sequelize = new Sequelize(dbConfig.development);
 */
const databaseConfig = {
  development: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    ssl: config.database.ssl,
    logging: false,

    // Connection Pool Configuration
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle,
    },

    define: {
      timestamps: true, // Enable createdAt/updatedAt fields
      underscored: true, // Use snake_case column names
      paranoid: true, // Enable soft deletes
      freezeTableName: true, // Prevent pluralization
    },

    timezone: config.timeZone,
    query: { raw: false },

    // Migration and seeder configuration
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders',
  },

  // Local development configuration
  local: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    ssl: config.database.ssl,
    logging: false,

    // Connection Pool Configuration
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle,
    },

    define: {
      timestamps: true, // Enable createdAt/updatedAt fields
      underscored: true, // Use snake_case column names
      paranoid: true, // Enable soft deletes
      freezeTableName: true, // Prevent pluralization
    },

    timezone: config.timeZone,
    query: { raw: false },

    // Migration and seeder configuration
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_migrations',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders',
  },

  // Test environment configuration
  test: {
    username: config.database.user,
    password: config.database.password,
    database: `${config.database.name}_test`,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: false,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },

    timezone: config.timeZone,
    // ...(config.development.test.databaseUrl && {
    //   use_env_variable: 'TEST_DATABASE_URL',
    // }),
  },

  // Additional environment configurations...
};

/**
 * Read replica configuration for scaling read operations
 * @type {Object|null}
 * @property {Array} read - Read replica connections
 * @property {Object} write - Primary write connection
 */
const readReplicaConfig = config.database?.readReplica?.host
  ? {
      read: [
        {
          host: config.database?.readReplica?.host,
          port: config.database?.readReplica?.port,
          username: config.database?.readReplica?.user,
          password: config.database?.readReplica?.password,
        },
      ],
      write: {
        host: config.database.host,
        port: config.database.port,
        username: config.database.user,
        password: config.database.password,
      },
    }
  : null;

/**
 * Retrieves configuration for current environment
 * @returns {Object} Environment-specific database configuration
 * @throws {Error} If environment configuration not found
 *
 * @example
 * const config = getCurrentConfig();
 * const sequelize = new Sequelize(config);
 */
const getCurrentConfig = () => {
  const env = config.mode || 'development';
  const envConfig = databaseConfig[env];

  if (!envConfig) {
    throw new Error(`Database configuration for environment "${env}" not found`);
  }

  if (readReplicaConfig) {
    envConfig.replication = readReplicaConfig;
  }

  return envConfig;
};

/**
 * Creates and configures Sequelize instance
 * @param {Object} customConfig - Optional custom configuration
 * @returns {Sequelize} Configured Sequelize instance
 *
 * @example
 * // Standard usage
 * const sequelize = createSequelizeInstance();
 *
 * @example
 * // Custom configuration
 * const customConfig = { database: 'custom_db' };
 * const sequelize = createSequelizeInstance(customConfig);
 */
const createSequelizeInstance = (customConfig = null) => {
  const dbConfig = customConfig || getCurrentConfig();
  let sequelize;

  if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
  } else if (dbConfig.replication) {
    sequelize = new Sequelize(dbConfig.database, null, null, {
      ...dbConfig,
      replication: dbConfig.replication,
    });
  } else {
    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
  }

  return sequelize;
};

/**
 * Tests database connection viability
 * @param {Sequelize} sequelizeInstance - Optional existing Sequelize instance
 * @returns {boolean} Connection success status
 *
 * @example
 * // Test default connection
 * const isConnected = await testConnection();
 *
 * @example
 * // Test specific connection
 * const sequelize = createSequelizeInstance();
 * const isConnected = await testConnection(sequelize);
 */
const testConnection = async (sequelizeInstance = null) => {
  const sequelize = sequelizeInstance || createSequelizeInstance();

  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${config.mode})`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Gracefully closes database connection
 * @param {Sequelize} sequelizeInstance - Sequelize instance to close
 *
 * @example
 * // In application shutdown
 * await closeConnection(sequelize);
 */
const closeConnection = async (sequelizeInstance) => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    console.log('🔌 Database connection closed');
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = databaseConfig;
module.exports.config = databaseConfig;
module.exports.getCurrentConfig = getCurrentConfig;
module.exports.createSequelizeInstance = createSequelizeInstance;
module.exports.testConnection = testConnection;
module.exports.closeConnection = closeConnection;
module.exports.readReplicaConfig = readReplicaConfig;
