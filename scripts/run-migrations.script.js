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

const runMigrations = async () => {
  try {
    console.log('🔐 Retrieving credentials from Vault...');
    const dbSecrets = await getSecret('db');

    // Create temporary configuration
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
      pool: {
        max: dbSecrets.pool_max || 5,
        min: dbSecrets.pool_min || 0,
        idle: dbSecrets.pool_idle || 400000,
      },
      logging: false,
    };

    const configContent = `module.exports = {
      local: ${JSON.stringify(tempConfig, null, 2)},
      development: ${JSON.stringify(tempConfig, null, 2)},
      test: ${JSON.stringify(tempConfig, null, 2)},
      production: ${JSON.stringify(tempConfig, null, 2)},
    };`;

    fs.writeFileSync(tempConfigPath, configContent);

    console.log('🚀 Running migrations...');
    execSync(`npx sequelize-cli db:migrate --config ${tempConfigPath}`, {
      stdio: 'inherit',
      env: process.env,
    });

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    process.exit(1);
  } finally {
    // Clean up temporary file
    fs.unlinkSync(tempConfigPath);
  }
};

runMigrations();
