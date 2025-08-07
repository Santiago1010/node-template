// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
// Third-party libraries for additional functionality
const { Sequelize } = require('sequelize');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
// Project-specific modules and configurations
const config = require('../env');

// ----------------- DECLARATION OF VARIABLES AND CONSTANTS ----------------- //

/**
 * Database configuration for different environments
 * This configuration is compatible with Sequelize CLI
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
    logging: config.development.debug ? console.log : false, // TODO: Change for helper

    // Connection Pool Configuration
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle,
    },

    // Define associations and models path
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      freezeTableName: true,
    },

    // Timezone configuration
    timezone: config.timeZone,

    // Query configuration
    query: {
      raw: false,
    },

    // Migration configuration
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_migrations',

    // Seeder configuration
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders',
  },

  test: {
    username: config.database.user,
    password: config.database.password,
    database: `${config.database.name}_test`,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: false, // Disable logging in tests

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

    // Use test database URL if available
    ...(config.development.test.databaseUrl && {
      use_env_variable: 'TEST_DATABASE_URL',
    }),
  },

  staging: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    ssl: config.database.ssl,
    logging: false,

    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle,
    },

    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },

    timezone: config.timeZone,

    // Use environment variable if available
    ...(config.database.url && {
      use_env_variable: 'DATABASE_URL',
    }),
  },

  production: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    ssl: config.database.ssl,
    logging: false, // Disable logging in production

    // Production optimized pool settings
    pool: {
      max: config.database.pool.max || 20,
      min: config.database.pool.min || 5,
      acquire: config.database.pool.acquire || 60000,
      idle: config.database.pool.idle || 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },

    timezone: config.timeZone,

    // Use environment variable for security
    ...(config.database.url && {
      use_env_variable: 'DATABASE_URL',
    }),

    // Production specific configurations
    dialectOptions: {
      ssl: config.database.ssl
        ? {
            require: true,
            rejectUnauthorized: false, // For self-signed certificates
          }
        : false,
    },
  },

  local: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.development.debug ? console.log : false,

    pool: {
      max: config.database.pool.max || 10,
      min: config.database.pool.min || 0,
      acquire: config.database.pool.acquire || 30000,
      idle: config.database.pool.idle || 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },

    timezone: config.timeZone,
  },

  admin: {
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: console.log, // Always log in admin mode

    pool: {
      max: 5, // Limited connections for admin
      min: 1,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
      paranoid: false, // Show deleted records in admin
      freezeTableName: true,
    },

    timezone: config.timeZone,
  },
};

/**
 * Read Replica Configuration (if available)
 */
const readReplicaConfig = config.database.readReplica.host
  ? {
      read: [
        {
          host: config.database.readReplica.host,
          port: config.database.readReplica.port,
          username: config.database.readReplica.user,
          password: config.database.readReplica.password,
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
 * Get current environment configuration
 */
const getCurrentConfig = () => {
  const env = config.mode || 'development';
  const envConfig = databaseConfig[env];

  if (!envConfig) {
    throw new Error(`Database configuration for environment "${env}" not found`);
  }

  // Add read replica configuration if available
  if (readReplicaConfig) {
    envConfig.replication = readReplicaConfig;
  }

  return envConfig;
};

/**
 * Create Sequelize instance
 */
const createSequelizeInstance = (customConfig = null) => {
  const dbConfig = customConfig || getCurrentConfig();

  let sequelize;

  // Use DATABASE_URL if specified
  if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
  } else if (dbConfig.replication) {
    // Use read/write replicas
    sequelize = new Sequelize(dbConfig.database, null, null, {
      ...dbConfig,
      replication: dbConfig.replication,
    });
  } else {
    // Standard connection
    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
  }

  return sequelize;
};

/**
 * Test database connection
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
 * Close database connection
 */
const closeConnection = async (sequelizeInstance) => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    console.log('🔌 Database connection closed');
  }
};

// Export configuration for Sequelize CLI
module.exports = databaseConfig;

// Export additional utilities
module.exports.config = databaseConfig;
module.exports.getCurrentConfig = getCurrentConfig;
module.exports.createSequelizeInstance = createSequelizeInstance;
module.exports.testConnection = testConnection;
module.exports.closeConnection = closeConnection;
module.exports.readReplicaConfig = readReplicaConfig;
