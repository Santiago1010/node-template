const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const config = require('../config/env');
const i18n = require('../config/i18n');
const { getSecret } = require('./vault.helper');
const { plog, perror, isDevelopmentMode } = require('./debug.helper');
const { PATHS } = require('../utils/constants.util');

dayjs.extend(utc);
dayjs.extend(timezone);

class MailerHelper {
  constructor() {
    this.transporter = null;
    this.defaultRecipients = {
      to: ['santiago.c.a_10@hotmail.es'],
      cc: ['santiagocorreaaguirre14@gmail.com'],
      bcc: [],
    };
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      const transportConfig = await this.getTransportConfig();
      this.transporter = nodemailer.createTransport(transportConfig);

      await this.transporter.verify();
      plog('Mailer initialized successfully', `Service: ${config.email.smtp.service}`);

      this.isInitialized = true;
    } catch (error) {
      perror('Failed to initialize mailer', error.message);
      throw error;
    }
  }

  async getTransportConfig() {
    const baseConfig = {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
    };

    if (isDevelopmentMode()) {
      baseConfig.auth = {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      };

      this.defaultRecipients = {
        to: [config.email.addresses.defaultFrom],
        cc: [],
        bcc: [],
      };
    } else {
      const credentials = await getSecret('smtp');
      baseConfig.auth = {
        user: credentials.user,
        pass: credentials.pass,
      };
    }

    if (config.email.smtp.service) {
      baseConfig.service = config.email.smtp.service;
    }

    if (config.email.smtp.tls) {
      baseConfig.tls = config.email.smtp.tls;
    }

    console.log(baseConfig);

    return baseConfig;
  }

  configureMailOptions(options) {
    const { to, cc, bcc, subject, text, attachments } = options;

    const mailOptions = {
      from: config.email.addresses.defaultFrom,
      subject,
    };

    if (isDevelopmentMode(true)) {
      mailOptions.to = this.defaultRecipients.to;
      mailOptions.cc = this.defaultRecipients.cc;
      mailOptions.bcc = this.defaultRecipients.bcc;
    } else {
      if (to) mailOptions.to = Array.isArray(to) ? to : [to];
      if (cc) mailOptions.cc = Array.isArray(cc) ? cc : [cc];
      if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc : [bcc];
    }

    if (text) {
      mailOptions.text = text;
    }

    if (attachments) {
      mailOptions.attachments = attachments;
    }

    return mailOptions;
  }

  async renderTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(PATHS.EMAIL_TEMPLATES, `${templateName}.ejs`);

      const enrichedVariables = {
        ...variables,
        currentYear: dayjs().year(),
        currentDate: dayjs().tz(config.timeZone.name).format('YYYY-MM-DD'),
        appName: config.name,
        appUrl: config.url,
        formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
          return dayjs(date).tz(config.timeZone.name).format(format);
        },
        t: (key, params) => i18n.__(key, params),
      };

      const html = await ejs.renderFile(templatePath, enrichedVariables);
      return html;
    } catch (error) {
      perror('Failed to render email template', {
        template: templateName,
        error: error.message,
      });
      throw error;
    }
  }

  async send(options) {
    const { templateName, variables, subject, to, cc, bcc, text, attachments, locale } = options;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (locale) {
        i18n.setLocale(locale);
      }

      const mailOptions = this.configureMailOptions({
        to,
        cc,
        bcc,
        subject,
        text,
        attachments,
      });

      if (templateName) {
        mailOptions.html = await this.renderTemplate(templateName, variables);
      }

      const info = await this.transporter.sendMail(mailOptions);

      plog('Email sent successfully', {
        messageId: info.messageId,
        recipients: mailOptions.to,
        subject: mailOptions.subject,
        template: templateName || 'None',
        timestamp: dayjs().tz(config.timeZone.name).format('YYYY-MM-DD HH:mm:ss'),
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      perror('Failed to send email', {
        subject,
        template: templateName || 'None',
        error: error.message,
        timestamp: dayjs().tz(config.timeZone.name).format('YYYY-MM-DD HH:mm:ss'),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  setDefaultRecipients(recipients) {
    if (isDevelopmentMode(true)) {
      if (recipients.to) {
        this.defaultRecipients.to = Array.isArray(recipients.to) ? recipients.to : [recipients.to];
      }
      if (recipients.cc) {
        this.defaultRecipients.cc = Array.isArray(recipients.cc) ? recipients.cc : [recipients.cc];
      }
      if (recipients.bcc) {
        this.defaultRecipients.bcc = Array.isArray(recipients.bcc) ? recipients.bcc : [recipients.bcc];
      }
    }
  }

  async close() {
    if (this.transporter) {
      this.transporter.close();
      this.isInitialized = false;
      plog('Mailer connection closed');
    }
  }
}

module.exports = MailerHelper;
