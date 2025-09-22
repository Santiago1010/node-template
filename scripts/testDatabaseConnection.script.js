const sequelize = require('../config/database/connection');
const { database } = require('../config/env');

(async () => {
  console.log('🔍 Testing database connection...');

  try {
    console.log('📋 Database configuration:');
    console.log(`   Host: ${database.host}:${database.port}`);
    console.log(`   Database: ${database.name}`);
    console.log(`   User: ${database.user}`);
    console.log(`   Dialect: ${database.dialect}`);

    console.log('\n🔐 Testing authentication...');
    await sequelize.authenticate();
    console.log('✅ Authentication successful');

    console.log('\n📊 Testing query execution...');
    const [results] = await sequelize.query('SELECT 1 as test');
    console.log('✅ Query successful:', results);

    console.log('\n📋 Testing table information...');
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${database.name}'
      LIMIT 5
    `);
    console.log('✅ Tables found:', tables.length);
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();
