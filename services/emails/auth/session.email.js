const ContextHelper = require('../../../helpers/context.helper');
const MailerHelper = require('../../../helpers/mailer.helper');

class SessionMailer extends MailerHelper {
  constructor() {
    super();

    return this;
  }

  async sendWelcomeEmail(email, firstName, token) {
    const host = ContextHelper.get('host');

    const url = `https://${host.url}/auth/verify-email?token=${token}`;

    return await this.send({
      to: email,
      subject: 'Bienvenido a nuestra aplicación',
      templateName: '/auth/welcome',
      variables: { firstName, token, url },
      locale: 'es',
    });
  }
}

module.exports = SessionMailer;
