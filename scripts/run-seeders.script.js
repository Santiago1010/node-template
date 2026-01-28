// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { getSecret } = require('../helpers/vault.helper');

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================
const tempConfigPath = path.join(__dirname, '../config/database/sequelize.temp.js');

const runSeeders = async () => {
  try {
    console.log('🔐 Retrieving credentials from Vault...');
    const dbSecrets = await getSecret('db');

    const tempConfig = {
      username: dbSecrets.user,
      password: dbSecrets.password,
      database: dbSecrets.name,
      host: dbSecrets.host,
      dialect: 'mysql',
      port: dbSecrets.port || 3306,
      dialectOptions: { decimalNumbers: true, timezone: '-05:00' },
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      timezone: '-05:00',
      logging: false,
    };

    const configContent = `module.exports = {
      local: ${JSON.stringify(tempConfig, null, 2)},
      development: ${JSON.stringify(tempConfig, null, 2)},
      test: ${JSON.stringify(tempConfig, null, 2)},
      production: ${JSON.stringify(tempConfig, null, 2)},
    };`;

    fs.writeFileSync(tempConfigPath, configContent);

    console.log('🌱 Running seeders...');
    execSync(`npx sequelize-cli db:seed:all --config ${tempConfigPath}`, {
      stdio: 'inherit',
      env: process.env,
    });

    console.log('✅ Seeders completed successfully');
  } catch (error) {
    console.error('❌ Error running seeders:', error.message);
    process.exit(1);
  } finally {
    fs.unlinkSync(tempConfigPath);
  }
};

runSeeders();
