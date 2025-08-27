const connection = require('../../config/database/connection');

const { usrAccounts } = connection.models;

class SessionService {
  static async login(credential, password) {
    const account = await usrAccounts.findOne({ raw: true });

    console.log(account);

    return { credential, password };
  }
}

module.exports = SessionService;
