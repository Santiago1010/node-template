// --------------------------- NODE DEPENDENCIES --------------------------- //
// Built-in modules from Node.js
const path = require('path');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
// Third-party libraries for additional functionality
const dotenv = require('dotenv');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
// Project-specific modules and configurations
const { modes } = require('../helpers/constants.helper');

// ----------------- DECLARATION OF VARIABLES AND CONSTANTS ----------------- //
// Set default timezone and locale for moment.js based on configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  mode: process.env.NODE_ENV,
  port: process.env.PORT,
  lang: process.env.DEFAULT_LANG,
  timeZone: process.env.DEFAULT_TIME_ZONE,
  url: process.env.BASE_URL.replace('${PORT}', process.env.PORT),
  isLocal: modes[process.env.NODE_ENV] === 0,
  cookieSecret: process.env.COOKIE_SECRET,
  database: {
    name: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  },
  jwt: {
    session: {
      secret: { access: process.env.JWT_SESSION_SECRET, refresh: process.env.JWT_REFRESH_SESSION_SECRET },
      subject: { access: process.env.JWT_SESSION_SUBJECT, refresh: process.env.JWT_REFRESH_SUBJECT },
      expiration: {
        access: parseInt(process.env.JWT_SESSION_TOKEN_EXPIRATION_TIME), // * 🚨 Alert! 🚧 Must always be in milliseconds.
        refresh: parseInt(process.env.JWT_SESSION_REFRESH_TOKEN_EXPIRATION_TIME), // * 🚨 Alert! 🚧 Must always be in milliseconds.
      },
    },
    confirmEmail: {
      secret: process.env.CONFIRM_EMAIL_SIGNATURE,
    },
    forgotPassword: {
      secret: process.env.FORGOT_PASSWORD_SECRET,
    },
  },
  aes: {
    users: {
      password: {
        key: process.env.USER_PASSWORD_KEY,
        iv: process.env.USER_PASSWORD_IV,
      },
      credentials: {
        key: process.env.ACCOUNT_CREDENTIAL_KEY,
        iv: process.env.ACCOUNT_CREDENTIAL_IV,
      },
    },
    hybrid: { key: process.env.HYBRID_KEY, iv: process.env.HYBRID_IV },
  },
  mailer: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    from: process.env.DEFAULT_FROM,
    to: process.env.DEFAULT_TO,
    header: process.env.EMAIL_HEADER,
    footer: process.env.EMAIL_FOOTER,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'YourSecurePassword',
  },
};

module.exports = config;
