const KeyService = require('../../services/security/keys.service');
const { success } = require('../../helpers/response.helper');

class KeyController {
  static async showPublicKey(_, res, next) {
    try {
      const publicKey = await KeyService.showPublicKey();

      return success(res, { data: { publicKey }, messagePath: 'showPublicKey.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = KeyController;
