const connection = require('../../config/database/connection');

const { usrAccounts } = connection.models;

class SessionService {
  static async login(credential, password) {
    const user = await usrAccounts.findOne();

    console.log(JSON.parse(JSON.stringify(user)));

    return { credential, password };
  }
}

module.exports = SessionService;
