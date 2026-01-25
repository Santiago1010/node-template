const { decryptWithRSA, getPrivateKey } = require('../utils/encrypt.util');

/**
 * Decrypts sensitive data in the request body, query, or params
 * @param {string[]} properties - List of property names to decrypt
 * @returns {Function} - Middleware function to decrypt sensitive data
 * @throws {Error} If decryption fails or property is not a string
 */
const decryptSensitiveData = (properties) => async (req, _, next) => {
  try {
    const privateKey = await getPrivateKey();
    const requestProperties = ['body', 'query', 'params'];

    for (const requestProperty of requestProperties) {
      if (req[requestProperty]) {
        for (const property of properties) {
          const encryptedValue = req[requestProperty][property];

          if (encryptedValue) {
            if (typeof encryptedValue !== 'string') throw new Error(`Property ${property} must be a string`);

            req[requestProperty][property] = decryptWithRSA(encryptedValue, privateKey);
          }
        }
      }
    }

    return next();
  } catch (error) {
    return next(new Error(`Failed to decrypt sensitive data: ${error.message}`));
  }
};

module.exports = { decryptSensitiveData };
