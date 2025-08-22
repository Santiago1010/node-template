// --------------------------- NODE DEPENDENCIES --------------------------- //
// Built-in modules from Node.js
const path = require('path');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
// Third-party libraries for additional functionality
const dotenv = require('dotenv');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
// Project-specific modules and configurations
const { modes } = require('../../helpers/constants.helper');

// ----------------- DECLARATION OF VARIABLES AND CONSTANTS ----------------- //
// Set default timezone and locale for moment.js based on configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  // =============================================================================
  // ENVIRONMENT CONFIGURATION
  // =============================================================================
  mode: process.env.NODE_ENV,
  port: process.env.PORT,
  url: process.env.BASE_URL?.replace('${PORT}', process.env.PORT),
  apiVersion: process.env.API_VERSION,
  isLocal: modes[process.env.NODE_ENV] === 0,

  // Internationalization
  lang: process.env.DEFAULT_LANG,
  timeZone: process.env.DEFAULT_TIME_ZONE,
  supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || [],

  // =============================================================================
  // DATABASE CONFIGURATION
  // =============================================================================
  database: {
    // Primary Database
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT,
    ssl: process.env.DB_SSL === 'true',

    // Connection Pool
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },

    // Alternative connection
    url: process.env.DATABASE_URL,

    // Read Replica
    readReplica: {
      host: process.env.DB_READ_HOST,
      port: process.env.DB_READ_PORT,
      user: process.env.DB_READ_USERNAME,
      password: process.env.DB_READ_PASSWORD,
    },
  },

  // =============================================================================
  // CACHE & SESSION STORAGE
  // =============================================================================
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'YourSecurePassword',
    db: parseInt(process.env.REDIS_DB) || 0,
    url: process.env.REDIS_URL,
  },

  memcached: {
    host: process.env.MEMCACHED_HOST,
    port: parseInt(process.env.MEMCACHED_PORT) || 11211,
  },

  // =============================================================================
  // AUTHENTICATION & SECURITY
  // =============================================================================
  security: {
    // General
    securePassword: process.env.SECURE_PASSWORD,
    defaultPasswordLength: parseInt(process.env.DEFAULT_PASSWORD_LENGTH) || 8,
    cookieSecret: process.env.COOKIE_SECRET,
    sessionSecret: process.env.SESSION_SECRET,

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
  },

  jwt: {
    session: {
      secret: {
        access: process.env.JWT_SESSION_SECRET,
        refresh: process.env.JWT_REFRESH_SESSION_SECRET,
      },
      subject: {
        access: process.env.JWT_SESSION_SUBJECT,
        refresh: process.env.JWT_REFRESH_SUBJECT,
      },
      expiration: {
        access: parseInt(process.env.JWT_SESSION_TOKEN_EXPIRATION_TIME), // 🚨 Alert! 🚧 Must always be in milliseconds.
        refresh: parseInt(process.env.JWT_SESSION_REFRESH_TOKEN_EXPIRATION_TIME), // 🚨 Alert! 🚧 Must always be in milliseconds.
      },
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
    },
    confirmEmail: {
      secret: process.env.CONFIRM_EMAIL_SIGNATURE,
      expiration: parseInt(process.env.CONFIRM_EMAIL_EXPIRATION) || 3600,
    },
    forgotPassword: {
      secret: process.env.FORGOT_PASSWORD_SECRET,
      expiration: parseInt(process.env.PASSWORD_RESET_EXPIRATION) || 3600,
    },
  },

  // OAuth Providers
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
    },
  },

  // Encryption (AES)
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
    hybrid: {
      key: process.env.HYBRID_KEY,
      iv: process.env.HYBRID_IV,
    },
  },

  // URLs
  urls: {
    confirmEmail: process.env.MAIN_CONFIRMATION,
    passwordReset: process.env.PASSWORD_RESET_URL,
  },

  // =============================================================================
  // EMAIL SERVICES
  // =============================================================================
  mailer: {
    // SMTP Configuration
    smtp: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },

    // Default addresses and templates
    defaults: {
      from: process.env.DEFAULT_FROM,
      to: process.env.DEFAULT_TO,
    },

    // Email Templates
    templates: {
      header: process.env.EMAIL_HEADER,
      footer: process.env.EMAIL_FOOTER,
    },

    // Email Service Providers
    providers: {
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
      mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
      },
      mailchimp: {
        apiKey: process.env.MAILCHIMP_API_KEY,
        listId: process.env.MAILCHIMP_LIST_ID,
      },
      awsSes: {
        region: process.env.AWS_SES_REGION,
        accessKey: process.env.AWS_SES_ACCESS_KEY,
        secretKey: process.env.AWS_SES_SECRET_KEY,
      },
    },
  },

  // =============================================================================
  // PAYMENT GATEWAYS
  // =============================================================================
  payments: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: process.env.STRIPE_CURRENCY || 'usd',
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE || 'sandbox',
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
    },
    square: {
      applicationId: process.env.SQUARE_APPLICATION_ID,
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    },
    mercadoPago: {
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY,
    },
    payU: {
      apiKey: process.env.PAYU_API_KEY,
      merchantId: process.env.PAYU_MERCHANT_ID,
      accountId: process.env.PAYU_ACCOUNT_ID,
      testMode: process.env.PAYU_TEST_MODE === 'true',
    },
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
  },

  // =============================================================================
  // CLOUD STORAGE & CDN
  // =============================================================================
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      s3: {
        bucket: process.env.AWS_S3_BUCKET,
      },
      cloudfront: {
        domain: process.env.AWS_CLOUDFRONT_DOMAIN,
      },
    },
    googleCloud: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
      storage: {
        bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      },
    },
    azure: {
      storageAccount: process.env.AZURE_STORAGE_ACCOUNT,
      storageKey: process.env.AZURE_STORAGE_KEY,
      container: process.env.AZURE_STORAGE_CONTAINER,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },

  // =============================================================================
  // AI & MACHINE LEARNING SERVICES
  // =============================================================================
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    },
    huggingFace: {
      apiKey: process.env.HUGGING_FACE_API_KEY,
    },
    cohere: {
      apiKey: process.env.COHERE_API_KEY,
    },
  },

  // =============================================================================
  // COMMUNICATION SERVICES
  // =============================================================================
  communication: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    whatsapp: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    },
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
  },

  // =============================================================================
  // ANALYTICS & MONITORING
  // =============================================================================
  analytics: {
    google: {
      trackingId: process.env.GOOGLE_ANALYTICS_TRACKING_ID,
      apiSecret: process.env.GOOGLE_ANALYTICS_API_SECRET,
    },
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN,
    },
    segment: {
      writeKey: process.env.SEGMENT_WRITE_KEY,
    },
    posthog: {
      apiKey: process.env.POSTHOG_API_KEY,
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
    },
  },

  monitoring: {
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME,
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    },
  },

  // =============================================================================
  // SEARCH SERVICES
  // =============================================================================
  search: {
    elasticsearch: {
      host: process.env.ELASTICSEARCH_HOST,
      port: parseInt(process.env.ELASTICSEARCH_PORT) || 9200,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    algolia: {
      applicationId: process.env.ALGOLIA_APPLICATION_ID,
      apiKey: process.env.ALGOLIA_API_KEY,
      searchKey: process.env.ALGOLIA_SEARCH_KEY,
    },
  },

  // =============================================================================
  // BACKGROUND JOBS & QUEUES
  // =============================================================================
  queues: {
    bull: {
      redis: {
        host: process.env.BULL_REDIS_HOST || process.env.REDIS_HOST,
        port: parseInt(process.env.BULL_REDIS_PORT) || parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.BULL_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
      },
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    },
    awsSqs: {
      queueUrl: process.env.AWS_SQS_QUEUE_URL,
      region: process.env.AWS_SQS_REGION || 'us-east-1',
    },
  },

  // =============================================================================
  // EXTERNAL APIs & SERVICES
  // =============================================================================
  externalApis: {
    maps: {
      google: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      mapbox: {
        accessToken: process.env.MAPBOX_ACCESS_TOKEN,
      },
    },
    weather: {
      openWeather: {
        apiKey: process.env.OPENWEATHER_API_KEY,
      },
    },
    currency: {
      exchangeRate: {
        apiKey: process.env.EXCHANGE_RATE_API_KEY,
      },
    },
    social: {
      twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
      },
      instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      },
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY,
      },
    },
  },

  // =============================================================================
  // DEVELOPMENT & TESTING
  // =============================================================================
  development: {
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    test: {
      databaseUrl: process.env.TEST_DATABASE_URL,
    },
    faker: {
      locale: process.env.FAKER_LOCALE || 'en_US',
      seed: parseInt(process.env.FAKER_SEED) || 12345,
    },
  },

  // =============================================================================
  // FEATURE FLAGS
  // =============================================================================
  features: {
    registration: process.env.ENABLE_REGISTRATION === 'true',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    twoFactorAuth: process.env.ENABLE_TWO_FACTOR_AUTH === 'true',
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    apiRateLimit: process.env.ENABLE_API_RATE_LIMITING === 'true',
    maintenanceMode: process.env.ENABLE_MAINTENANCE_MODE === 'true',

    // Third-party feature flags
    launchDarkly: {
      sdkKey: process.env.LAUNCHDARKLY_SDK_KEY,
    },
    optimizely: {
      sdkKey: process.env.OPTIMIZELY_SDK_KEY,
    },
  },

  // =============================================================================
  // CORS & SECURITY HEADERS
  // =============================================================================
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  },

  csp: {
    defaultSrc: process.env.CSP_DEFAULT_SRC?.split(' ') || ["'self'"],
    scriptSrc: process.env.CSP_SCRIPT_SRC?.split(' ') || ["'self'", "'unsafe-inline'"],
    styleSrc: process.env.CSP_STYLE_SRC?.split(' ') || ["'self'", "'unsafe-inline'"],
  },
};

module.exports = config;
