const { Sequelize } = require('sequelize');

const setupModels = require('../../models');
const { database } = require('../env');
const { isDevelopmentMode } = require('../../helpers/debug.helper');

const sequelize = new Sequelize(database.name, database.user, database.password, {
  host: database.host,
  dialect: database.dialect,
  port: database.port,
  dialectOptions: { decimalNumbers: true, timezone: '-05:00', supportBigNumbers: true, bigNumberStrings: true },
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  timezone: '-05:00',
  pool: { max: database.pool.max, min: database.pool.min, idle: database.pool.idle },
  define: { charset: 'utf8mb4', collate: 'utf8mb4_general_ci', timestamps: true, paranoid: true },
  logging: false,
});

setupModels(sequelize);

const initializeConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sincronizar modelos solo en desarrollo
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

initializeConnection().catch((error) => {
  console.error('💥 Failed to initialize database connection:', error);
});

module.exports = sequelize;
