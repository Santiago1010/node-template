const i18n = require('../../../config/i18n');
const { sms } = require('../../../config/env');
const { getSecret } = require('../../../helpers/vault.helper');

class SMSService {
  static async getClient() {
    const { account_sid: accountSid, auth_token: authToken } = await getSecret('messaging/sms/twlio');

    return require('twilio')(accountSid, authToken);
  }

  static async sendOTPLogin(to, otp, from = sms.twilio.phoneNumber) {
    const client = await this.getClient();

    const response = await client.messages.create({ body: i18n.__mf('messages.sms.otp.login', { otp }), from, to });

    return response;
  }
}

module.exports = SMSService;
