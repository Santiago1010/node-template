const dayjs = require('dayjs');

const i18n = require('../../../config/i18n');
const ContextHelper = require('../../../helpers/context.helper');
const MailerHelper = require('../../../helpers/mailer.helper');
const { getSequelize } = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');

class SessionMailer extends MailerHelper {
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
      logging: wrapLogging('[SessionMailer.getUserData] Get user by email'),
    });

    return user;
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

  async sendUnknownDeviceAlert(email, deviceData, token) {
    const host = ContextHelper.get('host');

    const userData = await this.getUserData(email);

    const confirmUrl = `${host.url}/confirm-device/${token}`;
    const securityUrl = `${host.url}/security-settings`;

    const deviceName =
      deviceData.userAgent ||
      `${deviceData.deviceType || 'Dispositivo'} - ${deviceData.browser || 'Navegador desconocido'}`;

    const browserInfo =
      deviceData.browserVersion && deviceData.browserVersion !== 'Unknown'
        ? `${deviceData.browser} ${deviceData.browserVersion}`
        : deviceData.browser || i18n.__('common.unknown');

    // const osInfo = deviceData.os && deviceData.os !== 'Unknown' ? deviceData.os : i18n.__('common.unknown');

    return await this.send({
      to: email,
      subject: i18n.__('email.sendUnknownDeviceAlert.subject'),
      templateName: '/auth/unknown-device',
      variables: {
        securityAlert: i18n.__('email.sendUnknownDeviceAlert.securityAlert'),
        unknownDeviceDetected: i18n.__('email.sendUnknownDeviceAlert.unknownDeviceDetected'),
        paragraph1: i18n.__mf('email.sendUnknownDeviceAlert.paragraph1', { firstName: userData.firstName }),
        paragraph2: i18n.__('email.sendUnknownDeviceAlert.paragraph2'),
        deviceInfo: {
          title: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.title'),
          device: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.device'),
          browser: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.browser'),
          location: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.location'),
          ip: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.ip'),
          date: i18n.__('email.sendUnknownDeviceAlert.deviceInfo.date'),
        },
        device: deviceName,
        browser: browserInfo,
        location: deviceData.location || i18n.__('common.unknown'),
        ipAddress: deviceData.ip || i18n.__('common.unknown'),
        loginDate: deviceData.loginDate || dayjs().format('DD [de] MMMM [de] YYYY, HH:mm'),
        safeModeActive: i18n.__('email.sendUnknownDeviceAlert.safeModeActive'),
        paragraph3: i18n.__('email.sendUnknownDeviceAlert.paragraph3'),
        safeModeFeatures: {
          title: i18n.__('email.sendUnknownDeviceAlert.safeModeFeatures.title'),
          feature1: i18n.__('email.sendUnknownDeviceAlert.safeModeFeatures.feature1'),
          feature2: i18n.__('email.sendUnknownDeviceAlert.safeModeFeatures.feature2'),
          feature3: i18n.__('email.sendUnknownDeviceAlert.safeModeFeatures.feature3'),
          feature4: i18n.__('email.sendUnknownDeviceAlert.safeModeFeatures.feature4'),
        },
        confirmInstructions: i18n.__('email.sendUnknownDeviceAlert.confirmInstructions'),
        confirmDevice: i18n.__('email.sendUnknownDeviceAlert.confirmDevice'),
        notYou: {
          title: i18n.__('email.sendUnknownDeviceAlert.notYou.title'),
          paragraph: i18n.__('email.sendUnknownDeviceAlert.notYou.paragraph'),
        },
        reviewSecurity: i18n.__('email.sendUnknownDeviceAlert.reviewSecurity'),
        alternative: {
          button: i18n.__('email.sendUnknownDeviceAlert.alternative.button'),
          copyPaste: i18n.__('email.sendUnknownDeviceAlert.alternative.copyPaste'),
        },
        thanks: i18n.__('email.sendUnknownDeviceAlert.thanks'),
        confirmUrl,
        securityUrl,
      },
      locale: 'es',
    });
  }
}

module.exports = SessionMailer;
