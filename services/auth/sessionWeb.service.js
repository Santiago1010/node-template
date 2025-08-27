const connection = require('../../config/database/connection');

class SessionService {
  static async login(credential, password) {
    const { usrAccounts } = connection.models;
    const user = await usrAccounts.findOne();

    console.log(JSON.parse(JSON.stringify(user)));

    return { credential, password };
  }
}

module.exports = SessionService;
