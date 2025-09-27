const { database } = require('..');

const dbConfig = {
  username: database.user,
  password: database.password,
  database: database.name,
  host: database.host,
  dialect: database.dialect,
  port: database.port,
  dialectOptions: { decimalNumbers: true, timezone: '-05:00' },
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  timezone: '-05:00',
  pool: { max: 5, min: 0, idle: 40 * 10000 },
  logging: false,
};

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};
