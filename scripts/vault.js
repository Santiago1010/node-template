const vault = require('../helpers/vault.helper');

(async () => {
  try {
    const secretPath = 'db';

    const dbCreds = await vault.getSecret(secretPath);

    console.log(dbCreds);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
})();
