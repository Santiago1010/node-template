const MailerHelper = require('../../../helpers/mailer.helper');

class SessionMailer extends MailerHelper {
  constructor() {
    super();

    return this;
  }

  async sendWelcomeEmail(user) {
    return await this.send({
      to: user.email,
      subject: 'Bienvenido a nuestra aplicación',
      templateName: '/auth/welcome',
      variables: {
        userName: user.name,
        userEmail: user.email,
      },
      locale: 'es',
    });
  }
}

module.exports = SessionMailer;
