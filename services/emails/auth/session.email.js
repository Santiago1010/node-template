const ContextHelper = require('../../../helpers/context.helper');
const MailerHelper = require('../../../helpers/mailer.helper');

class SessionMailer extends MailerHelper {
  constructor() {
    super();

    return this;
  }

  async sendWelcomeEmail(email, firstName, token) {
    const host = ContextHelper.get('host');

    return await this.send({
      to: email,
      subject: 'Bienvenido a nuestra aplicación',
      templateName: '/auth/welcome',
      variables: { firstName, token, host: host.url },
      locale: 'es',
    });
  }
}

module.exports = SessionMailer;
