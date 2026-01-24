const { error } = require('../../helpers/response.helper');
const { getPublicKey } = require('../../utils/encrypt.util');

class SecurityService {
  static async showPublicKey() {
    const publicKey = await getPublicKey();

    if (!publicKey) throw error({ httpCode: 404, messagePath: 'showPublicKey.notFound' });

    return publicKey;
  }
}

module.exports = SecurityService;
