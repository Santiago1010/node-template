const { Sequelize } = require('sequelize');

const setupModels = require('../../models');
const { database } = require('../env');

const sequelize = new Sequelize(database.name, database.user, database.password, {
  host: database.host,
  dialect: database.dialect,
  port: database.port,
  dialectOptions: { decimalNumbers: true, timezone: '-05:00' },
  timezone: '-05:00',
  pool: { max: 5, min: 0, idle: 40 * 10000 },
  logging: false,
});

setupModels(sequelize);

module.exports = sequelize;
