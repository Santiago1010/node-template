class SessionService {
  static async login(credential, password) {
    return { credential, password };
  }
}

module.exports = SessionService;
