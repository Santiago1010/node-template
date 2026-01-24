const dayjs = require('dayjs');

const i18n = require('../../../config/i18n');
const ContextHelper = require('../../../helpers/context.helper');
const MailerHelper = require('../../../helpers/mailer.helper');
const { getSequelize } = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');

class PasswordMailer extends MailerHelper {
  constructor() {
    super();

    return this;
  }

  async getUserData(email) {
    const sequelize = await getSequelize();
    const { usrUsers, usrAccounts, usrCredentials } = sequelize.models;

    const user = await usrUsers.findOne({
      attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
      include: {
        model: usrAccounts,
        as: 'accounts',
        attributes: [],
        required: true,
        include: {
          model: usrCredentials,
          as: 'credentials',
          attributes: [],
          where: { credentialType: 'email', credentialValue: email },
          required: true,
        },
      },
      subQuery: false,
      logging: wrapLogging('[PasswordMailer.getUserData] Get user by email'),
    });

    return user;
  }

  async sendPasswordResetEmail(email, token) {
    const host = ContextHelper.get('host');
    const userData = await this.getUserData(email);

    const resetUrl = `https://${host.url}/reset-password/${token}`;

    return await this.send({
      to: email,
      subject: i18n.__('email.sendPasswordResetEmail.subject'),
      templateName: '/auth/password-reset',
      variables: {
        passwordReset: i18n.__('email.sendPasswordResetEmail.passwordReset'),
        greeting: i18n.__mf('email.sendPasswordResetEmail.greeting', { firstName: userData.firstName }),
        paragraph1: i18n.__('email.sendPasswordResetEmail.paragraph1'),
        paragraph2: i18n.__('email.sendPasswordResetEmail.paragraph2'),
        resetPassword: i18n.__('email.sendPasswordResetEmail.resetPassword'),
        expirationNotice: {
          title: i18n.__('email.sendPasswordResetEmail.expirationNotice.title'),
          paragraph: i18n.__mf('email.sendPasswordResetEmail.expirationNotice.paragraph', {
            hours: i18n.__n('common.hours', 1),
          }),
        },
        securityTips: {
          title: i18n.__('email.sendPasswordResetEmail.securityTips.title'),
          tip1: i18n.__('email.sendPasswordResetEmail.securityTips.tip1'),
          tip2: i18n.__('email.sendPasswordResetEmail.securityTips.tip2'),
          tip3: i18n.__('email.sendPasswordResetEmail.securityTips.tip3'),
        },
        notRequested: {
          title: i18n.__('email.sendPasswordResetEmail.notRequested.title'),
          paragraph: i18n.__('email.sendPasswordResetEmail.notRequested.paragraph'),
        },
        contactSupport: i18n.__('email.sendPasswordResetEmail.contactSupport'),
        alternative: {
          button: i18n.__('email.sendPasswordResetEmail.alternative.button'),
          copyPaste: i18n.__('email.sendPasswordResetEmail.alternative.copyPaste'),
        },
        thanks: i18n.__('email.sendPasswordResetEmail.thanks'),
        resetUrl,
      },
      locale: 'es',
    });
  }

  async sendPasswordChangedEmail(email, deviceData = {}) {
    const host = ContextHelper.get('host');
    const userData = await this.getUserData(email);

    const securityUrl = `https://${host.url}/security-settings`;
    const supportUrl = `https://${host.url}/support`;

    const browserInfo =
      deviceData.browserVersion && deviceData.browserVersion !== 'Unknown'
        ? `${deviceData.browser} ${deviceData.browserVersion}`
        : deviceData.browser || i18n.__('common.unknown');

    const changeDate = deviceData.changeDate || dayjs().format('DD [de] MMMM [de] YYYY, HH:mm');

    return await this.send({
      to: email,
      subject: i18n.__('email.sendPasswordChangedEmail.subject'),
      templateName: '/auth/password-changed',
      variables: {
        passwordChanged: i18n.__('email.sendPasswordChangedEmail.passwordChanged'),
        greeting: i18n.__mf('email.sendPasswordChangedEmail.greeting', { firstName: userData.firstName }),
        paragraph1: i18n.__('email.sendPasswordChangedEmail.paragraph1'),
        changeDetails: {
          title: i18n.__('email.sendPasswordChangedEmail.changeDetails.title'),
          date: i18n.__('email.sendPasswordChangedEmail.changeDetails.date'),
          browser: i18n.__('email.sendPasswordChangedEmail.changeDetails.browser'),
          location: i18n.__('email.sendPasswordChangedEmail.changeDetails.location'),
          ip: i18n.__('email.sendPasswordChangedEmail.changeDetails.ip'),
        },
        changeDate,
        browser: browserInfo,
        location: deviceData.location || i18n.__('common.unknown'),
        ipAddress: deviceData.ip || i18n.__('common.unknown'),
        paragraph2: i18n.__('email.sendPasswordChangedEmail.paragraph2'),
        notYou: {
          title: i18n.__('email.sendPasswordChangedEmail.notYou.title'),
          paragraph: i18n.__('email.sendPasswordChangedEmail.notYou.paragraph'),
        },
        immediateActions: {
          title: i18n.__('email.sendPasswordChangedEmail.immediateActions.title'),
          action1: i18n.__('email.sendPasswordChangedEmail.immediateActions.action1'),
          action2: i18n.__('email.sendPasswordChangedEmail.immediateActions.action2'),
          action3: i18n.__('email.sendPasswordChangedEmail.immediateActions.action3'),
        },
        reviewSecurity: i18n.__('email.sendPasswordChangedEmail.reviewSecurity'),
        contactSupport: i18n.__('email.sendPasswordChangedEmail.contactSupport'),
        securityRecommendations: {
          title: i18n.__('email.sendPasswordChangedEmail.securityRecommendations.title'),
          rec1: i18n.__('email.sendPasswordChangedEmail.securityRecommendations.rec1'),
          rec2: i18n.__('email.sendPasswordChangedEmail.securityRecommendations.rec2'),
          rec3: i18n.__('email.sendPasswordChangedEmail.securityRecommendations.rec3'),
        },
        thanks: i18n.__('email.sendPasswordChangedEmail.thanks'),
        securityUrl,
        supportUrl,
      },
      locale: 'es',
    });
  }
}

module.exports = PasswordMailer;
