const { Sequelize } = require('sequelize');

const setupModels = require('../../models');
const { database } = require('../env');
const { isDevelopmentMode } = require('../../helpers/debug.helper');
const { getSecret } = require('../../helpers/vault.helper');

let sequelize = null;

const createSequelizeInstance = async () => {
  const dbSecrets = await getSecret('db');

  sequelize = new Sequelize(dbSecrets.name, dbSecrets.user, dbSecrets.password, {
    host: dbSecrets.host,
    dialect: database.dialect,
    port: dbSecrets.port || 3306,
    dialectOptions: {
      decimalNumbers: true,
      timezone: '-05:00',
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    timezone: '-05:00',
    pool: {
      max: dbSecrets.pool_max,
      min: dbSecrets.pool_min,
      idle: dbSecrets.pool_idle,
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      timestamps: true,
      paranoid: true,
    },
    logging: false,
  });

  setupModels(sequelize);

  return sequelize;
};

const initializeConnection = async () => {
  try {
    if (!sequelize) {
      await createSequelizeInstance();
    }

    await sequelize.authenticate();
    console.log('💾 Database connection established successfully');

    if (isDevelopmentMode(true)) {
      await sequelize.sync({ alter: false });
      console.log('🔄 Database models synchronized');
    }

    return sequelize;
  } catch (err) {
    console.error('❌ Unable to connect to database:', err.message);
    throw err;
  }
};

const sequelizePromise = initializeConnection();

const getSequelize = async () => {
  return await sequelizePromise;
};

module.exports = {
  sequelize: sequelizePromise,
  getSequelize,
  initializeConnection,
};
