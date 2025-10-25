const i18n = require('../../../config/i18n');
const ContextHelper = require('../../../helpers/context.helper');
const MailerHelper = require('../../../helpers/mailer.helper');

class SessionMailer extends MailerHelper {
  constructor() {
    super();

    return this;
  }

  async sendWelcomeEmail(email, firstName, token) {
    const host = ContextHelper.get('host');

    const url = `https://${host.url}/verify-email/${token}`;

    return await this.send({
      to: email,
      subject: i18n.__('email.sendWelcomeEmail.subject'),
      templateName: '/auth/welcome',
      variables: {
        welcomeGreeting: i18n.__mf('email.sendWelcomeEmail.welcomeGreeting', { firstName }),
        paragraph1: i18n.__('email.sendWelcomeEmail.paragraph1'),
        importantInformation: i18n.__('email.sendWelcomeEmail.importantInformation'),
        paragraph2: i18n.__('email.sendWelcomeEmail.paragraph2'),
        verifyMyEmail: i18n.__('email.sendWelcomeEmail.verifyMyEmail'),
        whatYouDo: i18n.__('email.sendWelcomeEmail.whatYouDo'),
        explorePanel: {
          title: i18n.__('email.sendWelcomeEmail.explorePanel.title'),
          paragraph: i18n.__('email.sendWelcomeEmail.explorePanel.paragraph'),
        },
        configProfile: {
          title: i18n.__('email.sendWelcomeEmail.configProfile.title'),
          paragraph: i18n.__('email.sendWelcomeEmail.configProfile.paragraph'),
        },
        reminder: {
          title: i18n.__('email.sendWelcomeEmail.reminder.title'),
          paragraph: i18n.__mf('email.sendWelcomeEmail.reminder.paragraph', { hours: i18n.__n('common.hours', 1) }),
        },
        questions: i18n.__('email.sendWelcomeEmail.questions'),
        contactSupport: i18n.__('email.sendWelcomeEmail.contactSupport'),
        alternative: {
          button: i18n.__('email.sendWelcomeEmail.alternative.button'),
          copyPaste: i18n.__('email.sendWelcomeEmail.alternative.copyPaste'),
        },
        thanks: i18n.__('email.sendWelcomeEmail.thanks'),
        url,
      },
      locale: 'es',
    });
  }
}

module.exports = SessionMailer;
